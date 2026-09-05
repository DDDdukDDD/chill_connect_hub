-- =============================================================================
-- ⚡ Atomic Stored Procedures & Concurrency Control
-- Guarantees Zero Race Conditions / Overbooking during High-Traffic Meetup Rush
-- =============================================================================

/**
 * join_event_atomic:
 * Safely registers a user for a meetup using row-level locking (FOR UPDATE).
 * Returns JSON object with status, message, and updated capacity.
 */
CREATE OR REPLACE FUNCTION join_event_atomic(
    p_event_id VARCHAR(50),
    p_user_id UUID,
    p_user_name VARCHAR(150),
    p_user_avatar TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_event RECORD;
    v_ticket_code VARCHAR(30);
    v_new_count INT;
    v_is_full BOOLEAN;
BEGIN
    -- 1. Lock the event row for update (prevents concurrent writes from interleaving)
    SELECT * INTO v_event
    FROM events
    WHERE id = p_event_id
    FOR UPDATE;

    -- Check if event exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'not_found',
            'message', 'ไม่พบกิจกรรมที่ระบุ'
        );
    END IF;

    -- Check if event is ended or cancelled
    IF v_event.status IN ('ended', 'cancelled') THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'event_ended',
            'message', 'กิจกรรมนี้สิ้นสุดหรือถูกยกเลิกแล้ว'
        );
    END IF;

    -- Check if user has already joined
    IF EXISTS (
        SELECT 1 FROM event_participants 
        WHERE event_id = p_event_id AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'already_joined',
            'message', 'คุณได้เข้าร่วมกิจกรรมนี้แล้ว'
        );
    END IF;

    -- Check capacity constraint
    IF v_event.participants_count >= v_event.max_participants THEN
        -- Auto-correct status if not marked full
        IF v_event.status <> 'full' THEN
            UPDATE events SET status = 'full' WHERE id = p_event_id;
        END IF;

        RETURN jsonb_build_object(
            'success', false,
            'status', 'event_full',
            'message', 'กิจกรรมนี้มีผู้เข้าร่วมเต็มจำนวนแล้ว',
            'participantsCount', v_event.participants_count,
            'maxParticipants', v_event.max_participants
        );
    END IF;

    -- 2. Increment participant counter safely
    v_new_count := v_event.participants_count + 1;
    v_is_full := (v_new_count >= v_event.max_participants);

    UPDATE events
    SET 
        participants_count = v_new_count,
        status = CASE WHEN v_is_full THEN 'full'::event_status_type ELSE status END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_event_id;

    -- 3. Generate unique ticket code (e.g. CCH-2026-X8F9)
    v_ticket_code := 'CCH-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- 4. Insert participant record
    INSERT INTO event_participants (
        event_id,
        user_id,
        user_name,
        user_avatar,
        ticket_code,
        note,
        joined_at
    ) VALUES (
        p_event_id,
        p_user_id,
        p_user_name,
        p_user_avatar,
        v_ticket_code,
        p_note,
        CURRENT_TIMESTAMP
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'joined',
        'message', 'เข้าร่วมกิจกรรมสำเร็จ!',
        'ticketCode', v_ticket_code,
        'participantsCount', v_new_count,
        'maxParticipants', v_event.max_participants
    );
END;
$$;

/**
 * claim_quest_atomic:
 * Safely updates user progress and awards XP/Badge upon completion
 */
CREATE OR REPLACE FUNCTION claim_quest_atomic(
    p_quest_id VARCHAR(50),
    p_user_id UUID,
    p_progress_increment INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_quest RECORD;
    v_user_quest RECORD;
    v_new_progress INT;
    v_just_completed BOOLEAN := false;
BEGIN
    SELECT * INTO v_quest FROM challenge_quests WHERE id = p_quest_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'status', 'not_found', 'message', 'ไม่พบชาเลนจ์');
    END IF;

    -- Upsert user quest row
    INSERT INTO user_quests (quest_id, user_id, current_progress, is_completed)
    VALUES (p_quest_id, p_user_id, 0, false)
    ON CONFLICT (quest_id, user_id) DO NOTHING;

    -- Lock and retrieve
    SELECT * INTO v_user_quest
    FROM user_quests
    WHERE quest_id = p_quest_id AND user_id = p_user_id
    FOR UPDATE;

    IF v_user_quest.is_completed THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_completed',
            'message', 'คุณทำภารกิจนี้สำเร็จเรียบร้อยแล้ว'
        );
    END IF;

    v_new_progress := LEAST(v_quest.target_total, v_user_quest.current_progress + p_progress_increment);
    v_just_completed := (v_new_progress >= v_quest.target_total);

    UPDATE user_quests
    SET 
        current_progress = v_new_progress,
        is_completed = v_just_completed,
        completed_at = CASE WHEN v_just_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_user_quest.id;

    -- Award XP if just completed
    IF v_just_completed THEN
        UPDATE users
        SET 
            total_xp = total_xp + v_quest.reward_xp,
            user_level = 1 + (total_xp + v_quest.reward_xp) / 500,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'status', CASE WHEN v_just_completed THEN 'completed' ELSE 'progress_updated' END,
        'message', CASE WHEN v_just_completed THEN 'ยินดีด้วย! คุณทำภารกิจสำเร็จแล้ว' ELSE 'บันทึกความคืบหน้าสำเร็จ' END,
        'currentProgress', v_new_progress,
        'targetTotal', v_quest.target_total,
        'earnedXp', CASE WHEN v_just_completed THEN v_quest.reward_xp ELSE 0 END,
        'earnedBadge', CASE WHEN v_just_completed THEN v_quest.reward_badge ELSE NULL END
    );
END;
$$;
