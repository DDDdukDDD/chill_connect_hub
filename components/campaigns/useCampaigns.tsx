'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';
import { CampaignDialog } from '@/components/campaigns/CampaignDialog';
import { RewardDialog } from '@/components/rewards/RewardDialog';
import { REWARD_SHOP_ITEMS, type RewardShopItem } from '@/data/rewardsData';
import { recall, remember } from '@/lib/clientMemory';
import type { CampaignView, MyCampaign } from '@/lib/campaigns/types';
import type { useMyRewards } from '@/lib/useMyRewards';

const PENDING_KEY = 'cch_campaign_pending';

// A guest pressed "join": the sign-up may leave this page (onboarding, LINE), so the wish waits in this tab
const readPending = () => {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
};
const writePending = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(PENDING_KEY, id);
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Without storage the member comes back to the popup and presses the button themselves
  }
};

interface UseCampaignsOptions {
  /** The campaigns this page shows; a joined one that is not among them still opens */
  campaigns: CampaignView[];
  isLoggedIn: boolean;
  isAuthReady: boolean;
  rewards: ReturnType<typeof useMyRewards>;
  onLoggedIn: () => void;
  onToast: (message: string) => void;
}

/**
 * The campaign popup and the member's joined campaigns, for a page that shows campaigns. `open` opens the popup,
 * and so does a link with ?campaign=ID. A guest who presses join signs up first and is joined on the way back.
 */
export function useCampaigns({ campaigns, isLoggedIn, isAuthReady, rewards, onLoggedIn, onToast }: UseCampaignsOptions) {
  const pathname = usePathname();
  const [mine, setMine] = useState<MyCampaign[]>(() => recall<MyCampaign[]>('campaigns') ?? []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  // A reward opened from a campaign or the promo row shows here, on the same page
  const [rewardItem, setRewardItem] = useState<RewardShopItem | null>(null);
  const [isRewardAuthOpen, setIsRewardAuthOpen] = useState(false);
  const linkRead = useRef(false);
  const { refresh: refreshRewards } = rewards;
  const onToastRef = useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      setMine([]);
      setIsLoaded(true);
      return;
    }
    let active = true;
    fetch('/api/campaigns/mine', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.success) return;
        setMine(data.campaigns);
        remember('campaigns', data.campaigns);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isAuthReady, isLoggedIn]);

  const enroll = useCallback(async (id: string) => {
    setIsEnrolling(true);
    try {
      const data = await fetch('/api/campaigns/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id }),
      }).then((res) => res.json());
      if (!data.success) {
        onToastRef.current(data.message ?? 'เข้าร่วมแคมเปญไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      setMine(data.campaigns);
      remember('campaigns', data.campaigns);
      await refreshRewards();
      onToastRef.current('เข้าร่วมแคมเปญแล้ว ดูได้ในมายฮับ');
    } catch {
      onToastRef.current('เข้าร่วมแคมเปญไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsEnrolling(false);
    }
  }, [refreshRewards]);

  const claim = async (id: string) => {
    setIsEnrolling(true);
    try {
      const data = await fetch('/api/campaigns/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, action: 'claim' }),
      }).then((res) => res.json());
      if (!data.success) {
        onToastRef.current(data.message ?? 'ยืนยันรับรางวัลไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      setMine(data.campaigns);
      remember('campaigns', data.campaigns);
      onToastRef.current('ยืนยันรับรางวัลแล้ว ทีมงานจะติดต่อกลับ');
    } catch {
      onToastRef.current('ยืนยันรับรางวัลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsEnrolling(false);
    }
  };

  const leave = async (id: string) => {
    setIsEnrolling(true);
    try {
      const data = await fetch('/api/campaigns/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, action: 'leave' }),
      }).then((res) => res.json());
      if (!data.success) {
        onToastRef.current(data.message ?? 'ออกจากแคมเปญไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      setMine(data.campaigns);
      remember('campaigns', data.campaigns);
      setOpenId(null);
      onToastRef.current('ออกจากแคมเปญแล้ว ชาเลนจ์ที่เริ่มไว้ยังทำต่อได้');
    } catch {
      onToastRef.current('ออกจากแคมเปญไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsEnrolling(false);
    }
  };

  // ?campaign=ID opens the popup: the way back from signing up, or a link someone shared
  useEffect(() => {
    if (!isAuthReady || linkRead.current) return;
    linkRead.current = true;
    const id = new URLSearchParams(window.location.search).get('campaign');
    if (id) setOpenId(id);
  }, [isAuthReady]);

  // The guest who pressed join is back, signed in: finish what they asked for
  useEffect(() => {
    if (!isLoggedIn || !openId || readPending() !== openId) return;
    writePending(null);
    void enroll(openId);
  }, [isLoggedIn, openId, enroll]);

  const close = () => {
    setOpenId(null);
    writePending(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('campaign')) {
      url.searchParams.delete('campaign');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
  };

  const shown = [...campaigns, ...mine.map((entry) => entry.campaign)].find((campaign) => campaign.id === openId);
  const dialog = shown ? (
    <>
      <CampaignDialog
        campaign={shown}
        isLoggedIn={isLoggedIn}
        isEnrolled={mine.some((entry) => entry.campaign.id === shown.id)}
        entry={mine.find((entry) => entry.campaign.id === shown.id)}
        onClaim={() => void claim(shown.id)}
        isEnrolling={isEnrolling}
        rewards={rewards}
        onClose={close}
        onLeave={() => void leave(shown.id)}
        onRedeemPrize={() => {
          const prize = REWARD_SHOP_ITEMS.find((item) => item.id === shown.rewardId);
          if (!prize) return;
          close();
          setRewardItem(prize);
        }}
        onJoin={() => {
          if (isLoggedIn) {
            void enroll(shown.id);
            return;
          }
          writePending(shown.id);
          setIsAuthOpen(true);
        }}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="signup"
        returnTo={`${pathname}?campaign=${encodeURIComponent(shown.id)}`}
        onLoginSuccess={() => {
          setIsAuthOpen(false);
          onLoggedIn();
        }}
      />
    </>
  ) : null;

  const rewardDialog = (
    <>
      {rewardItem && (
        <RewardDialog
          key={rewardItem.id}
          item={rewardItem}
          rewards={rewards}
          isLoggedIn={isLoggedIn}
          onClose={() => setRewardItem(null)}
          onNeedLogin={() => setIsRewardAuthOpen(true)}
          onToast={onToast}
        />
      )}
      <AuthModal
        isOpen={isRewardAuthOpen}
        onClose={() => setIsRewardAuthOpen(false)}
        onLoginSuccess={() => {
          setIsRewardAuthOpen(false);
          onLoggedIn();
        }}
      />
    </>
  );

  return {
    mine,
    isLoaded,
    open: setOpenId as (id: string) => void,
    /** Opens a reward's popup on this page (the promo row's reward cards) */
    openReward: setRewardItem as (item: RewardShopItem) => void,
    dialog: (
      <>
        {dialog}
        {rewardDialog}
      </>
    ),
  };
}
