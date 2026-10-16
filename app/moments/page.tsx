'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { EventDetailModal } from '@/components/EventDetailModal';
import { SpotDetailModal } from '@/components/SpotDetailModal';
import { AuthModal, LogoutConfirmModal } from '@/components/AuthModal';
import { RequireMembershipModal } from '@/components/RequireMembershipModal';
import { CreateEventModal } from '@/components/CreateEventModal';
import { useAuth } from '@/lib/useAuth';
import { useMemberSession } from '@/lib/useMemberSession';
import { isEventEnded } from '@/lib/dateUtils';
import { nameInitial, tidyDisplayName } from '@/lib/displayName';
import {
  EventItem,
  CommunityPost,
  ChallengeQuest,
} from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Heart,
  Share2,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  LogIn,
  MapPin,
  ArrowRight,
  Bookmark,
  MessageCircle,
  Send,
  Calendar,
  Users,
  Flag,
  Pencil,
  Trash2,
  Trophy,
  Zap,
  Ticket,
} from 'lucide-react';
import { DialogShell, dialogButton } from '@/components/auth/DialogShell';
import { MomentPhotos } from '@/components/moments/MomentPhotos';
import { getQuestBrandReward } from '@/lib/questDisplay';
import { StoriesRail } from '@/components/moments/StoriesRail';
import { MomentComposer, CountedQuestNotice, type CountedQuest, type MomentComposerInitial } from '@/components/moments/MomentComposer';

// Moments written by members live on the server (/api/moments); the bundled samples stay local.
type ServerMoment = Omit<CommunityPost, 'comments'> & { isMine?: boolean; isSample?: boolean; comments?: { id: string; userName: string; userAvatar: string; text: string; timeAgo: string }[] };

/** A member's photo, or a neutral tile with their initial when they have none */
function avatarOf(name: string, url?: string | null): string {
  if (url) return url;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#E2E8F0"/><text x="48" y="60" font-size="40" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#475569">${nameInitial(name)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function fromServerMoment(m: ServerMoment): CommunityPost {
  const name = tidyDisplayName(m.userName);
  return {
    ...m,
    userName: name,
    userAvatar: avatarOf(name, m.userAvatar),
    eventId: m.targetId || m.id,
    eventTitle: m.targetTitle || m.location,
    category: m.category || 'chill',
    sharesCount: 0,
    comments: (m.comments ?? []).map((c) => ({ ...c, userName: tidyDisplayName(c.userName), userAvatar: avatarOf(c.userName, c.userAvatar), content: c.text })),
  } as unknown as CommunityPost;
}

/** The page a moment's place, event or challenge lives on */
function targetHrefOf(type?: string, id?: string): string | null {
  if (!id) return null;
  const base = type === 'spot' ? '/spots' : type === 'community' ? '/community' : type === 'fair' ? '/fairs' : type === 'challenge' ? '/challenges' : null;
  return base ? `${base}/${encodeURIComponent(id)}` : null;
}
const isMinePost = (post: CommunityPost) => Boolean((post as { isMine?: boolean }).isMine);

const QUEST_PHOTO_FALLBACK = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80';

/** A suggested challenge the way the challenges list shows it: the photo, the XP on it, the reward on its lower edge, then the title */
function QuestSuggestCard({ quest }: { quest: ChallengeQuest }) {
  const reward = getQuestBrandReward(quest);
  return (
    <Link href={`/challenges/${encodeURIComponent(quest.id)}`} className="group/quest block">
      <span className="relative block aspect-[2/1] rounded-xl overflow-hidden bg-slate-100">
        <img loading="lazy" src={quest.badgeCoverImg || quest.image || QUEST_PHOTO_FALLBACK} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/quest:scale-105" />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7C3AED] text-[11px] font-bold text-white whitespace-nowrap tabular-nums">
          <Zap className="w-3 h-3" aria-hidden="true" />
          +{(quest.rewardPoints ?? 0).toLocaleString()} XP
        </span>
        <span className={`absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold min-w-0 ${reward.type === 'brand_partner' ? 'bg-amber-100 text-amber-900' : 'bg-[#F5F3FF] text-[#5B21B6]'}`}>
          {reward.type === 'brand_partner' && <Ticket className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{reward.title}</span>
        </span>
      </span>
      <span className="block mt-2 text-sm font-bold text-slate-900 group-hover/quest:text-[#2563EB] leading-snug line-clamp-2">{quest.title}</span>
    </Link>
  );
}

async function momentRequest(url: string, method: string, body?: unknown): Promise<{ ok: boolean; message: string; moment?: ServerMoment }> {
  try {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => null);
    return { ok: res.ok && json?.success !== false, message: json?.message || 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ', moment: json?.moment };
  } catch {
    return { ok: false, message: 'เชื่อมต่อไม่ได้ ลองอีกครั้งนะ' };
  }
}

function MomentsContent() {
  const searchParams = useSearchParams();
  const session = useMemberSession();
  const memberId = session.member?.id;
  // Ids of posts stored on the server; actions on them go through the API
  const serverPostIds = useRef(new Set<string>());
  const [activeNavTab, setActiveNavTab] = useState('moments');
  const { isLoggedIn, isAuthReady, handleSetIsLoggedIn } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRequireMembershipOpen, setIsRequireMembershipOpen] = useState(false);
  const [membershipActionTitle, setMembershipActionTitle] = useState('เพื่อแชร์ภาพและแบ่งปันโมเมนต์');
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Filter & Search States
  const urlLocation = searchParams.get('location') || '';
  const urlTab = searchParams.get('tab');
  const urlMomentId = searchParams.get('momentId');
  // A place or event page links here to show only its own moments; `location` carries its name for the filter chip
  const urlTargetType = searchParams.get('targetType') || '';
  const urlTargetId = searchParams.get('targetId') || '';
  const [locationFilter, setLocationFilter] = useState<string>(urlLocation);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'following' | 'popular' | 'saved' | 'mine'>(
    urlTab === 'mine' ? 'mine' : urlTab === 'popular' ? 'popular' : 'all'
  );
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // Instagram-Grade Micro-Interactions States
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [doubleTapPostId, setDoubleTapPostId] = useState<string | null>(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Sync if URL location changes
  useEffect(() => {
    if (urlLocation) {
      setLocationFilter(urlLocation);
    }
  }, [urlLocation]);

  // Posts State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  // The feed is read from the server page by page
  const FEED_PAGE_SIZE = 8;
  const [feedPage, setFeedPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [highlights, setHighlights] = useState<CommunityPost[]>([]);
  // Shown after posting when the moment counted toward a challenge the member is doing
  const [countedNotice, setCountedNotice] = useState<CountedQuest | null>(null);
  const [suggested, setSuggested] = useState<{ id: string; displayName: string; avatarUrl?: string; momentCount: number; trusted: boolean; approvedHost: boolean }[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  // Small dialogs: confirm a delete, report a post, edit a caption, finish verifying before posting
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [editPost, setEditPost] = useState<{ id: string; caption: string } | null>(null);
  const [isDialogBusy, setIsDialogBusy] = useState(false);
  // Challenges for the sidebar (stories live in StoriesRail)
  const [sidebarQuests, setSidebarQuests] = useState<ChallengeQuest[]>([]);
  // Approved events and live challenges from the server, for the sidebar and for what a moment is about
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Older builds kept posts and bookmarks in the browser; both live on the account now
  useEffect(() => {
    try {
      localStorage.removeItem('chill_user_moments');
      localStorage.removeItem('chill_saved_moments');
    } catch {
      // storage can be unavailable (private mode); nothing to clean then
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const feedUrl = (page: number) =>
    `/api/moments?tab=${activeTabFilter}&limit=${FEED_PAGE_SIZE}&page=${page}${
      urlTargetId && locationFilter === urlLocation
        ? `&targetType=${encodeURIComponent(urlTargetType)}&targetId=${encodeURIComponent(urlTargetId)}`
        : locationFilter
        ? `&location=${encodeURIComponent(locationFilter)}`
        : ''
    }`;
  type FeedJson = { moments?: ServerMoment[]; pagination?: { hasNextPage?: boolean } };
  const takeFeed = (json: FeedJson) => {
    const list = (json.moments ?? []).map(fromServerMoment);
    list.forEach((p) => serverPostIds.current.add(p.id));
    const followed = (json.moments ?? []).filter((m) => (m as { isFollowingAuthor?: boolean }).isFollowingAuthor).map((m) => (m as { authorId?: string }).authorId as string);
    if (followed.length) setFollowingIds((prev) => Array.from(new Set([...prev, ...followed])));
    setSavedPostIds((prev) => Array.from(new Set([...prev, ...(json.moments ?? []).filter((m) => (m as { isSaved?: boolean }).isSaved).map((m) => m.id)])));
    setHasMorePosts(Boolean(json.pagination?.hasNextPage));
    return list;
  };

  // First page: reloads when the tab, the place filter or the signed-in member changes
  useEffect(() => {
    if (!session.isLoaded) return;
    let active = true;
    setIsFeedLoading(true);
    (async () => {
      const json: FeedJson = await fetch(feedUrl(1), { cache: 'no-store' }).then((res) => res.json()).catch(() => ({}));
      if (!active) return;
      let list = takeFeed(json);
      // A shared link to one moment: make sure it is in the list even when it is not on the first page
      if (urlMomentId && !list.some((p) => p.id === urlMomentId)) {
        const one = await fetch(`/api/moments/${encodeURIComponent(urlMomentId)}`, { cache: 'no-store' }).then((res) => res.json()).catch(() => null);
        if (!active) return;
        if (one?.moment) {
          serverPostIds.current.add(one.moment.id);
          list = [fromServerMoment(one.moment), ...list];
        }
      }
      setPosts(list);
      setFeedPage(1);
      setIsFeedLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- feedUrl depends only on the listed values
  }, [session.isLoaded, memberId, activeTabFilter, locationFilter, urlMomentId]);

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    setIsLoadingMore(true);
    const json: FeedJson = await fetch(feedUrl(feedPage + 1), { cache: 'no-store' }).then((res) => res.json()).catch(() => ({}));
    const more = takeFeed(json);
    setPosts((prev) => [...prev, ...more.filter((p) => !prev.some((x) => x.id === p.id))]);
    setFeedPage((p) => p + 1);
    setIsLoadingMore(false);
  };

  // Highlights (the most liked moments) and members worth following
  useEffect(() => {
    if (!session.isLoaded) return;
    let active = true;
    fetch('/api/moments?tab=popular&limit=10', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: FeedJson) => active && setHighlights((json.moments ?? []).filter((m) => m.images?.[0]).map(fromServerMoment)))
      .catch(() => undefined);
    fetch('/api/members/suggested', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => active && setSuggested(json.members ?? []))
      .catch(() => undefined);
    fetch('/api/quests?limit=30', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { quests?: ChallengeQuest[] }) => {
        if (!active) return;
        const open = (json.quests ?? []).filter((q) => q.status !== 'ended' && q.status !== 'draft');
        setSidebarQuests(open.slice(0, 4));
      })
      .catch(() => undefined);
    fetch('/api/events')
      .then((res) => res.json())
      .then((json: { events?: EventItem[] }) => active && setLiveEvents(json.events ?? []))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [session.isLoaded, memberId]);


  const handleFollowMember = async (id: string, name: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle(`เพื่อติดตามโมเมนต์ของ ${name}`);
      setIsRequireMembershipOpen(true);
      return;
    }
    const isFollowing = followingIds.includes(id);
    const result = await momentRequest(`/api/members/${id}/actions`, 'POST', { action: isFollowing ? 'unfollow' : 'follow' });
    if (!result.ok) return showToast(result.message);
    setFollowingIds((prev) => (isFollowing ? prev.filter((x) => x !== id) : [...prev, id]));
    showToast(isFollowing ? `เลิกติดตาม ${name} แล้ว` : `ติดตาม ${name} แล้ว ดูโพสต์ได้ที่แท็บ "ติดตาม"`);
  };

  const handleReportPost = async () => {
    if (!reportReason) return;
    if (!reportPostId) return;
    setIsDialogBusy(true);
    const result = await momentRequest(`/api/moments/${reportPostId}/actions`, 'POST', { action: 'report', reason: reportReason });
    setIsDialogBusy(false);
    if (!result.ok) return showToast(result.message);
    // A post hidden by enough reports leaves the feed straight away
    if ((result as { autoHidden?: boolean }).autoHidden) setPosts((prev) => prev.filter((p) => p.id !== reportPostId));
    setReportPostId(null);
    setReportReason('');
    showToast('ส่งรายงานให้ทีมงานแล้ว ขอบคุณที่ช่วยกันดูแล');
  };

  const handleSaveEdit = async () => {
    if (!editPost || !editPost.caption.trim()) return;
    setIsDialogBusy(true);
    const result = await momentRequest(`/api/moments/${editPost.id}`, 'PATCH', { caption: editPost.caption.trim() });
    setIsDialogBusy(false);
    if (!result.ok || !result.moment) return showToast(result.message);
    const updated = fromServerMoment(result.moment);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditPost(null);
    showToast('แก้ไขโมเมนต์แล้ว');
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const result = await momentRequest(`/api/moments/${postId}/actions`, 'POST', { action: 'delete_comment', commentId });
    if (!result.ok || !result.moment) return showToast(result.message);
    const updated = fromServerMoment(result.moment);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  // Handle direct link to shared moment (?momentId=...)
  useEffect(() => {
    if (!urlMomentId) return;
    setActiveTabFilter('all');
    setLocationFilter('');

    const timer = setTimeout(() => {
      const el = document.getElementById(`moment-${urlMomentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedPostId(urlMomentId);
        showToast('เปิดและเน้นโมเมนต์ที่แชร์เรียบร้อย');
        const clearTimer = setTimeout(() => {
          setHighlightedPostId(null);
        }, 4000);
        return () => clearTimeout(clearTimer);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [urlMomentId, posts]);

  // Dynamic responsive initial count based on screen size (4 mobile, 6 tablet, 8 desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width >= 1024) {
      setVisibleCount(8);
    } else if (width >= 640) {
      setVisibleCount(6);
    } else {
      setVisibleCount(4);
    }
  }, []);

  // Lightbox Modal State for Viewing Fullscreen Images
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    index: number;
    caption?: string;
  } | null>(null);
  // Swipe left or right in the photo viewer on touch screens
  const viewerTouchX = useRef<number | null>(null);

  // Modal Selection Targets
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<LifestyleSpotItem | null>(null);
  const [eventFavorites, setEventFavorites] = useState<string[]>([]);
  const [spotFavorites, setSpotFavorites] = useState<string[]>([]);

  // The share form opens filled in when My Hub or a place page sends a member here to share it
  const [composerInitial, setComposerInitial] = useState<MomentComposerInitial | null>(null);
  useEffect(() => {
    const eventToShare = searchParams.get('createForEvent');
    if (!eventToShare) return;
    const titleToShare = searchParams.get('eventTitle');
    const locToShare = searchParams.get('location') || '';
    const imgToShare = searchParams.get('image');
    const typeParam = searchParams.get('createForType');
    const typeToShare = typeParam === 'spot' || typeParam === 'fair' ? typeParam : 'community';
    setComposerInitial({
      target: titleToShare ? { type: typeToShare, id: eventToShare, title: titleToShare, location: locToShare } : undefined,
      location: locToShare,
      caption: titleToShare ? (typeToShare === 'community' ? `แชร์ความประทับใจจากกิจกรรม "${titleToShare}"\n` : `ไปมาแล้ว "${titleToShare}"\n`) : undefined,
      image: imgToShare || undefined,
    });
    setIsCreateModalOpen(true);
  }, [searchParams]);

  const handleOpenCreateModal = () => {
    setComposerInitial(null);
    setIsCreateModalOpen(true);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxData(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxData((prev) => {
          if (!prev) return null;
          const newIdx = prev.index === 0 ? prev.images.length - 1 : prev.index - 1;
          return { ...prev, index: newIdx };
        });
      } else if (e.key === 'ArrowRight') {
        setLightboxData((prev) => {
          if (!prev) return null;
          const newIdx = prev.index === prev.images.length - 1 ? 0 : prev.index + 1;
          return { ...prev, index: newIdx };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxData]);

  // Open Lightbox
  const openLightbox = (images: string[], index: number, caption?: string) => {
    setLightboxData({ images, index, caption });
  };

  // Toggle Like (Cheer)
  const handleToggleLike = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อส่งหัวใจและกำลังใจให้เพื่อนๆ');
      setIsRequireMembershipOpen(true);
      return;
    }
    if (serverPostIds.current.has(postId)) {
      const liked = posts.find((p) => p.id === postId)?.isLiked;
      void momentRequest(`/api/moments/${postId}/actions`, 'POST', { action: liked ? 'unlike' : 'like' });
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikesCount = newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          if (newIsLiked) showToast('ส่งหัวใจฮีลใจเรียบร้อย!');
          return { ...post, isLiked: newIsLiked, likesCount: newLikesCount };
        }
        return post;
      })
    );
  };

  // Double-Tap Image to Like (Instagram Style)
  const handleDoubleTapLike = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อส่งหัวใจและกำลังใจให้เพื่อนๆ');
      setIsRequireMembershipOpen(true);
      return;
    }

    // Trigger visual bursting heart animation
    setDoubleTapPostId(postId);
    setTimeout(() => {
      setDoubleTapPostId((prev) => (prev === postId ? null : prev));
    }, 750);

    // Like post if not already liked
    if (serverPostIds.current.has(postId) && !posts.find((p) => p.id === postId)?.isLiked) {
      void momentRequest(`/api/moments/${postId}/actions`, 'POST', { action: 'like' });
    }
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          if (p.isLiked) return p;
          showToast('ส่งหัวใจฮีลใจเรียบร้อย!');
          return {
            ...p,
            isLiked: true,
            likesCount: p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  // Toggle Save / Bookmark to Personal Collection (Instagram Style)
  const handleToggleSave = (postId: string) => {
    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อบันทึกโมเมนต์ลงคอลเลกชันส่วนตัว');
      setIsRequireMembershipOpen(true);
      return;
    }

    if (serverPostIds.current.has(postId)) {
      void momentRequest(`/api/moments/${postId}/actions`, 'POST', { action: savedPostIds.includes(postId) ? 'unsave' : 'save' });
    }
    setSavedPostIds((prev) => {
      const isSaved = prev.includes(postId);
      const next = isSaved ? prev.filter((id) => id !== postId) : [...prev, postId];
      if (isSaved) {
        showToast('ยกเลิกการบันทึกโมเมนต์');
      } else {
        showToast('บันทึกโมเมนต์ลงคอลเลกชันส่วนตัวแล้ว');
      }
      return next;
    });
  };

  // Delete User's Own Post
  const handleDeletePost = async (postId: string) => {
    const result = await momentRequest(`/api/moments/${postId}`, 'DELETE');
    if (!result.ok) return showToast(result.message);
    serverPostIds.current.delete(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('ลบโมเมนต์ของคุณเรียบร้อยแล้ว');
  };

  // Toggle Comments Drawer
  const handleToggleCommentsDrawer = (postId: string) => {
    setExpandedCommentPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  // Submit Comment
  const handleSubmitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    if (!isLoggedIn) {
      setMembershipActionTitle('เพื่อร่วมแสดงความคิดเห็นและส่งพลังบวก');
      setIsRequireMembershipOpen(true);
      return;
    }

    // Comments on members' posts are saved on the server, under the signed-in member's own name
    if (serverPostIds.current.has(postId)) {
      const result = await momentRequest(`/api/moments/${postId}/actions`, 'POST', { action: 'comment', text });
      if (!result.ok || !result.moment) return showToast(result.message);
      const updated = fromServerMoment(result.moment);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      return showToast('ส่งความคิดเห็นเรียบร้อยแล้ว!');
    }

    const myName = tidyDisplayName(session.member?.displayName ?? '') || 'สมาชิก';
    const newComment = {
      id: `c-${Date.now()}`,
      userName: myName,
      userAvatar: avatarOf(myName, session.member?.avatarUrl),
      text: text,
      content: text,
      timeAgo: 'เมื่อสักครู่นี้',
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const existing = p.comments || [];
          return {
            ...p,
            comments: [...existing, newComment],
            commentsCount: (p.commentsCount || existing.length) + 1,
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    showToast('ส่งความคิดเห็นเรียบร้อยแล้ว!');
  };

  // Copy Share Link & Increment Share Count (Direct moment link & copy toast)
  const handleShareMoment = async (post: CommunityPost) => {
    // Increment share count
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
        }
        return p;
      })
    );

    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/moments?momentId=${encodeURIComponent(post.id)}`;

      // 1. If mobile browser supports native Web Share API (iOS Safari / Android)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${post.userName} บน Chill & Connect Hub`,
            text: post.caption?.slice(0, 120) || 'ร่วมชมโมเมนต์ไลฟ์สไตล์บน Chill & Connect Hub',
            url: shareUrl,
          });
          showToast('แชร์โมเมนต์แล้ว');
          return;
        } catch (err: any) {
          // If user aborted/cancelled the native share sheet, do not error out
          if (err.name === 'AbortError') return;
        }
      }

      // 2. Fallback to Clipboard Copy (Desktop & Web)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            showToast('คัดลอกลิงก์โมเมนต์แล้ว');
          })
          .catch(() => {
            showToast('คัดลอกลิงก์โมเมนต์แล้ว');
          });
      } else {
        // Fallback for older browsers
        try {
          const tempInput = document.createElement('input');
          tempInput.value = shareUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast('คัดลอกลิงก์โมเมนต์แล้ว');
        } catch {
          showToast('แชร์โมเมนต์แล้ว');
        }
      }
    }
  };
 
  // Infinite scroll: the next page is fetched when the end of the list comes into view
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && void loadMorePosts(), { threshold: 0.1, rootMargin: '200px' });
    observer.observe(target);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMorePosts reads the listed values
  }, [hasMorePosts, isLoadingMore, feedPage, posts.length]);

  // Tabs and the place filter are applied by the server
  const filteredPosts = posts;
  const displayedPosts = posts;

  // Curated Recommended Events for Sidebar (Meetups & Fairs)
  const recommendedEvents = useMemo(() => {
    const valid = liveEvents.filter((e) => e.status !== 'ended' && !isEventEnded(e));
    const community = valid.filter((e) => e.eventType === 'community');
    const fairs = valid.filter((e) => e.eventType !== 'community');

    const list: EventItem[] = [];
    if (community[0]) list.push(community[0]);
    if (fairs[0]) list.push(fairs[0]);
    if (community[1]) list.push(community[1]);
    if (fairs[1]) list.push(fairs[1]);

    return list.length > 0 ? list : valid.slice(0, 4);
  }, [liveEvents]);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#1E293B] flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        isLoggedIn={isLoggedIn}
        isAuthReady={isAuthReady}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenLogout={() => setIsLogoutModalOpen(true)}
        onOpenCreateEvent={() => {
          if (!isLoggedIn) {
            setIsAuthModalOpen(true);
            showToast('กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรมใหม่');
          } else {
            setIsCreateEventModalOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1140px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2.5 pb-28 sm:pt-4 sm:pb-12 space-y-3 sm:space-y-4">
        
        {/* Hidden SEO/A11y H1 */}
        <h1 className="sr-only">โมเมนต์และบรรยากาศจริงจากชุมชน Chill & Connect Hub</h1>

        {/* 2. Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* Left Column (8-cols): Main Visual Feed */}
          <div className="min-w-0 w-full max-w-[560px] mx-auto space-y-4">
            {/* Stories (24 hours) first, then highlights: the most liked moments; in the feed column so its edges line up with the posts */}
            <section aria-label="สตอรี่และไฮไลต์" className="bg-white -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 shadow-2xs p-4 sm:p-5">

              <StoriesRail
                isLoggedIn={isLoggedIn}
                onNeedLogin={() => {
                  setMembershipActionTitle('เพื่อแชร์สตอรี่ของคุณ');
                  setIsRequireMembershipOpen(true);
                }}
                onToast={showToast}
                after={
                  <>
                {highlights.length > 0 && (
                  <li className="shrink-0 flex flex-col items-center justify-start gap-1.5 px-1" aria-hidden="true">
                    <span className="h-16 sm:h-[72px] w-px bg-slate-200" />
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">ไฮไลต์</span>
                  </li>
                )}
                {highlights.map((h) => (
                  <li key={h.id} className="shrink-0 w-16 sm:w-[72px]">
                    <button type="button" onClick={() => openLightbox(h.images ?? [], 0, h.caption)} className="w-full flex flex-col items-center gap-1.5 cursor-pointer" aria-label={`ดูรูปยอดนิยมของ ${h.userName}`}>
                      <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden border border-slate-200">
                        <img loading="lazy" src={h.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="w-full text-[11px] font-semibold text-slate-600 truncate text-center">{h.userName}</span>
                    </button>
                  </li>
                ))}
                  </>
                }
              />
            </section>

            {/* Quick Post Prompt Input Bar & Segmented Tabs Container */}
            <div className="bg-white -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl p-4 sm:p-5 border-y sm:border border-slate-200/80 shadow-2xs space-y-3.5">
              {/* Quick Post Prompt Input Bar (Adaptive for Logged in vs Logged out) */}
              <div className="flex items-center gap-3">
                {isLoggedIn ? (
                  <img loading="lazy"
                    src={avatarOf(tidyDisplayName(session.member?.displayName ?? ''), session.member?.avatarUrl)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อแชร์ภาพและแบ่งปันโมเมนต์กับชาวฮับ');
                      setIsRequireMembershipOpen(true);
                    } else {
                      handleOpenCreateModal();
                    }
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-medium px-4 py-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-2 min-w-0 cursor-pointer border border-slate-200"
                >
                  <span className="truncate">
                    {isLoggedIn ? 'แชร์โมเมนต์ของคุณ' : 'แชร์โมเมนต์'}
                  </span>
                  {isLoggedIn ? (
                    <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs shrink-0 whitespace-nowrap">
                      เข้าสู่ระบบ
                    </span>
                  )}
                </button>
              </div>

              {/* Feed views (3 tabs) + two personal shortcuts */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70" role="tablist" aria-label="มุมมองฟีด">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'following', label: 'ติดตาม' },
                    { id: 'popular', label: 'ยอดนิยม' },
                  ].map((tab) => {
                    const isActive = activeTabFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTabFilter(tab.id as typeof activeTabFilter)}
                        className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isActive ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                {[
                  { id: 'saved', label: 'โพสต์ที่บันทึกไว้', Icon: Bookmark },
                  { id: 'mine', label: 'โมเมนต์ของฉัน', Icon: User },
                ].map(({ id, label, Icon }) => {
                  const isActive = activeTabFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTabFilter((isActive ? 'all' : id) as typeof activeTabFilter)}
                      aria-pressed={isActive}
                      aria-label={label}
                      title={label}
                      className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                        isActive ? 'bg-blue-50 border-blue-200 text-[#2563EB]' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              {(activeTabFilter === 'saved' || activeTabFilter === 'mine') && (
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{activeTabFilter === 'saved' ? 'โพสต์ที่บันทึกไว้' : 'โมเมนต์ของฉัน'}</h2>
                  <button type="button" onClick={() => setActiveTabFilter('all')} className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer whitespace-nowrap">
                    กลับไปฟีด
                  </button>
                </div>
              )}

              {/* Active Location Filter Pill (if any) */}
              {locationFilter && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 font-semibold animate-fade-in">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">
                      กำลังกรองโมเมนต์เฉพาะ: <strong>"{locationFilter}"</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationFilter('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    <X className="w-3 h-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Contextual Empty State for "ที่บันทึกไว้" (Saved Posts) */}
            {!isFeedLoading && displayedPosts.length === 0 && activeTabFilter === 'saved' && isLoggedIn && (
              <div className="bg-amber-50/40 rounded-3xl p-8 border border-dashed border-amber-200/90 text-center space-y-3.5 animate-fade-in my-4">
                <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs border border-amber-200/60">
                  <Bookmark className="w-6 h-6 fill-amber-500/20" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    ยังไม่มีโมเมนต์ที่คุณบันทึกไว้
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    พบภาพถ่ายบรรยากาศหรือพิกัดที่ถูกใจ? กดปุ่ม <strong>"บันทึก"</strong> ที่มุมขวาล่างของโพสต์ เพื่อเก็บไว้ในคอลเลกชันส่วนตัวของคุณ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  สำรวจโมเมนต์ทั้งหมด
                </button>
              </div>
            )}

            {/* Standard Empty State for other tabs */}
            {!isFeedLoading && displayedPosts.length === 0 && activeTabFilter !== 'saved' && (!['mine', 'following'].includes(activeTabFilter) || isLoggedIn) && (
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {locationFilter
                    ? `ไม่พบโมเมนต์ที่ตรงกับการค้นหา "${locationFilter}"`
                    : activeTabFilter === 'following'
                    ? 'ยังไม่มีโพสต์จากคนที่คุณติดตาม ลองกดติดตามสมาชิกที่ชอบดูนะ'
                    : activeTabFilter === 'mine'
                    ? 'คุณยังไม่ได้แชร์โมเมนต์เลย ออกไปใช้ชีวิตแล้วมาแบ่งปันรูปสวยๆ กันนะ'
                    : 'ยังไม่มีโมเมนต์ในหมวดนี้'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLocationFilter('');
                    setActiveTabFilter('all');
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  ดูโมเมนต์ทั้งหมด
                </button>
              </div>
            )}

            {/* Guest State for "โมเมนต์ของฉัน" when Logged Out */}
            {['mine', 'following', 'saved'].includes(activeTabFilter) && !isLoggedIn && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3.5 animate-fade-in shadow-xs">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    เข้าสู่ระบบเพื่อดูส่วนนี้
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    โมเมนต์ของคุณ โพสต์ที่บันทึกไว้ และโพสต์จากคนที่คุณติดตาม จะแสดงที่นี่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบทันที</span>
                </button>
              </div>
            )}

            {/* Loading placeholders for the first page */}
            {isFeedLoading && (
              <div className="space-y-5" aria-busy="true" aria-label="กำลังโหลดโมเมนต์">
                {[0, 1].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden animate-pulse">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-20 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-64 sm:h-80 bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feed Posts List */}
            <div className={`space-y-5 ${isFeedLoading ? 'hidden' : ''}`}>
              {displayedPosts.map((post, postIndex) => {
                const targetTitle = post.targetTitle || post.eventTitle;
                const images = post.images && post.images.length > 0 ? post.images : ['/event-hyrox.png'];
                const count = images.length;
                const authorId = (post as { authorId?: string | null }).authorId;
                const profileHref = authorId ? `/profile?id=${authorId}` : null;
                const targetHref = targetHrefOf(post.targetType, post.targetId);
                const evidenceRejected = (post as { evidenceRejected?: { note: string } }).evidenceRejected;

                return (
                  <React.Fragment key={post.id}>
                  <article
                    id={`moment-${post.id}`}
                    className={`bg-white -mx-3.5 sm:mx-0 rounded-none sm:rounded-3xl border-y sm:border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-500 hover:shadow-md ${
                      highlightedPostId === post.id
                        ? 'ring-4 ring-[#2563EB]/40 bg-blue-50/15 shadow-xl scale-[1.01]'
                        : ''
                    }`}
                  >
                    {/* Post Author Bar */}
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {profileHref ? (
                          <Link href={profileHref} className="shrink-0" aria-label={`ดูโปรไฟล์ของ ${post.userName}`}>
                            <img loading="lazy" src={post.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          </Link>
                        ) : (
                          <img loading="lazy" src={post.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-900 truncate">
                              {profileHref ? <Link href={profileHref} className="hover:text-[#2563EB] hover:underline">{post.userName}</Link> : post.userName}
                            </h3>
                            {authorId && !isMinePost(post) && !followingIds.includes(authorId) && (
                              <button type="button" onClick={() => handleFollowMember(authorId, post.userName)} className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer whitespace-nowrap">
                                ติดตาม
                              </button>
                            )}

                            {/* Facebook-Style Check-In Tag in Author Line */}
                            {post.targetType === 'general' && post.location && post.location !== 'ไลฟ์สไตล์ทั่วไป' && (
                              <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                                <span>— อยู่ที่</span>
                                <button
                                  type="button"
                                  onClick={() => setLocationFilter(post.location)}
                                  className="font-bold text-slate-800 hover:text-[#2563EB] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                                  title="คลิกเพื่อกรองโพสต์ในสถานที่นี้"
                                >
                                  <MapPin className="w-3 h-3 text-[#F26430] shrink-0" />
                                  <span className="max-w-[150px] sm:max-w-[220px] truncate">{post.location}</span>
                                </button>
                              </span>
                            )}
                          </div>

                          {/* Where the moment is from: a link to that place, event or challenge's own page */}
                          {post.targetType !== 'general' && targetTitle && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 mt-0.5 min-w-0">
                              <MapPin className="w-3 h-3 shrink-0 text-[#F26430]" aria-hidden="true" />
                              {targetHref ? (
                                <Link href={targetHref} className="truncate hover:text-[#2563EB] hover:underline">{targetTitle}</Link>
                              ) : (
                                <span className="truncate">{targetTitle}</span>
                              )}
                            </div>
                          )}
                          {post.targetType === 'general' && (!post.location || post.location === 'ไลฟ์สไตล์ทั่วไป') && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold mt-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-[11px] font-medium">
                                <span>ไลฟ์สไตล์ทั่วไป</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(post as { isSample?: boolean }).isSample && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap" title="โพสต์ตัวอย่างระหว่างพัฒนา ไม่มีเจ้าของจริง">ตัวอย่าง</span>
                        )}
                        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                          {post.timeAgo}
                        </span>
                        {isMinePost(post) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditPost({ id: post.id, caption: post.caption })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="แก้ไขข้อความ"
                              aria-label="แก้ไขข้อความ"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(post.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบโมเมนต์นี้"
                              aria-label="ลบโมเมนต์นี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          Boolean(authorId) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isLoggedIn) {
                                  setMembershipActionTitle('เพื่อรายงานโพสต์ที่ไม่เหมาะสม');
                                  setIsRequireMembershipOpen(true);
                                } else {
                                  setReportReason('');
                                  setReportPostId(post.id);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="รายงานโพสต์นี้"
                              aria-label="รายงานโพสต์นี้"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Photos: the grid the large social feeds use (see MomentPhotos); a tap opens the viewer */}
                    <MomentPhotos
                      images={images}
                      ratio={(post as { imageRatio?: number }).imageRatio}
                      alt={post.caption}
                      onOpen={(i) => openLightbox(images, i, post.caption)}
                      onDoubleTap={() => handleDoubleTapLike(post.id)}
                    />

                    {/* Bottom Body: Action Bar + Caption + Quick Cheers */}
                    <div className="p-4 space-y-3">
                      {/* Action Bar: Heart + Share on left, Bookmark / Save on right (Instagram-Style) */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          {/* Heart / Like Cheer Button (Numbers only, NO text) */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              post.isLiked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                            title="ส่งหัวใจ"
                            aria-label={post.isLiked ? 'เลิกส่งหัวใจ' : 'ส่งหัวใจ'}
                            aria-pressed={Boolean(post.isLiked)}
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                              }`}
                            />
                            <span>{post.likesCount}</span>
                          </button>

                          {/* Comment Drawer Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCommentsDrawer(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              expandedCommentPostIds.includes(post.id)
                                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                            }`}
                            title="ความคิดเห็น"
                            aria-label="ความคิดเห็น"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-500" />
                            <span>{(post.comments && post.comments.length) || post.commentsCount || 0}</span>
                          </button>

                          {/* Share Button (Icon + Shares Count, NO text word per user request) */}
                          <button
                            type="button"
                            onClick={() => handleShareMoment(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="แชร์โมเมนต์"
                            aria-label="แชร์โมเมนต์"
                          >
                            <Share2 className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>

                        {/* Right: Instagram-Style Bookmark / Save to Collection Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSave(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            savedPostIds.includes(post.id)
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                          }`}
                          title={savedPostIds.includes(post.id) ? 'บันทึกแล้ว' : 'บันทึกเก็บไว้ดู'}
                          aria-label={savedPostIds.includes(post.id) ? 'เลิกบันทึก' : 'บันทึกเก็บไว้ดู'}
                          aria-pressed={savedPostIds.includes(post.id)}
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-transform active:scale-125 ${
                              savedPostIds.includes(post.id) ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                            }`}
                          />
                          <span className="hidden sm:inline">
                            {savedPostIds.includes(post.id) ? 'บันทึกแล้ว' : 'บันทึก'}
                          </span>
                        </button>
                      </div>

                      {/* Caption Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {post.caption}
                      </p>

                      {/* Only the author sees that staff did not count the photo as a visit */}
                      {evidenceRejected && (
                        <p className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
                          ทีมงานตรวจรูปแล้ว โมเมนต์นี้ยังไม่นับในชาเลนจ์{evidenceRejected.note ? ` · ${evidenceRejected.note}` : ''}
                        </p>
                      )}

                      {/* Expandable Inline Comments Section */}
                      {expandedCommentPostIds.includes(post.id) && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-fade-in">
                          {/* Comments List */}
                          {post.comments && post.comments.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                              {post.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-2.5 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100"
                                >
                                  <img loading="lazy"
                                    src={comment.userAvatar}
                                    alt={comment.userName}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-800 text-[11px] truncate">
                                        {comment.userName}
                                      </span>
                                      <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-2">
                                        {comment.timeAgo}
                                        {(comment as { isMine?: boolean }).isMine && (
                                          <button type="button" onClick={() => handleDeleteComment(post.id, comment.id)} className="font-bold text-slate-500 hover:text-rose-600 cursor-pointer">
                                            ลบ
                                          </button>
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                                      {comment.content || comment.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 py-1 text-center">
                              ยังไม่มีความคิดเห็น ร่วมเป็นคนแรกที่ส่งพลังบวกกันนะ
                            </p>
                          )}

                          {/* Inline Comment Input Box */}
                          <form
                            onSubmit={(e) => handleSubmitComment(post.id, e)}
                            className="flex items-center gap-2 pt-1"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              placeholder={
                                isLoggedIn
                                  ? 'เขียนความคิดเห็นหรือส่งพลังบวก...'
                                  : 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น...'
                              }
                              className="flex-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Send className="w-3 h-3" />
                              <span>ส่ง</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </article>
                  {postIndex === 2 && recommendedEvents.length > 0 && (
                    <section aria-label="กิจกรรมแนะนำ" className="lg:hidden bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">กิจกรรมแนะนำ</h2>
                        <Link href="/community" className="text-xs font-bold text-[#2563EB] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
                      </div>
                      <ul className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
                        {recommendedEvents.map((ev) => (
                          <li key={ev.id} className="shrink-0 w-40">
                            <button type="button" onClick={() => setSelectedEvent(ev)} className="w-full text-left cursor-pointer">
                              <span className="block aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                                <img loading="lazy" src={ev.image} alt="" className="w-full h-full object-cover" />
                              </span>
                              <span className="block mt-2 text-xs font-bold text-slate-900 leading-snug line-clamp-2">{ev.title}</span>
                              <span className="block mt-0.5 text-[11px] font-medium text-slate-500 truncate">{ev.date}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {postIndex === 6 && sidebarQuests.length > 0 && (
                    <section aria-label="ชาเลนจ์แนะนำ" className="lg:hidden bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-bold text-slate-900">ชาเลนจ์แนะนำ</h2>
                        <Link href="/challenges" className="text-xs font-bold text-[#2563EB] hover:underline whitespace-nowrap">ดูทั้งหมด</Link>
                      </div>
                      <ul className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
                        {sidebarQuests.map((q) => (
                          <li key={q.id} className="shrink-0 w-56">
                            <QuestSuggestCard quest={q} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Auto Infinite Scroll Sentinel Target */}
            {hasMorePosts ? (
              <div ref={sentinelRef} className="py-6 text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-full shadow-2xs text-xs text-slate-700 font-bold">
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>
                    กำลังโหลดโมเมนต์เพิ่มเติม…
                  </span>
                </div>
              </div>
            ) : !isFeedLoading && filteredPosts.length > 0 ? (
              <div className="bg-slate-50/80 rounded-2xl p-5 text-center border border-slate-200 space-y-2 my-6">
                <p className="font-bold text-xs text-slate-700">
                  คุณดูโมเมนต์ครบแล้ว
                </p>
                <p className="text-[11px] text-slate-500">
                  ออกไปใช้ชีวิต เที่ยวคาเฟ่ หรือร่วมกิจกรรม แล้วมาแบ่งปันโมเมนต์ของคุณนะ
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setMembershipActionTitle('เพื่อแชร์ภาพและแบ่งปันโมเมนต์กับชาวฮับ');
                      setIsRequireMembershipOpen(true);
                    } else {
                      handleOpenCreateModal();
                    }
                  }}
                  className="mt-1 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  + สร้างโพสต์โมเมนต์ของคุณ
                </button>
              </div>
            ) : null}
          </div>

          {/* Right Column (4-cols): Sticky Sidebar */}
          <aside className="hidden lg:block space-y-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pb-6 shrink-0">
            {/* Widget 1: members worth following (real, verified members who post) */}
            {suggested.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-none">สมาชิกที่น่าติดตาม</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">สมาชิกที่ยืนยันแล้ว และแชร์โมเมนต์อยู่</p>
                  </div>
                </div>
                <ul className="space-y-3 pt-1">
                  {suggested.map((m) => {
                    const isFollowing = followingIds.includes(m.id);
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-2.5">
                        <Link href={`/profile?id=${m.id}`} className="flex items-center gap-2.5 min-w-0 group">
                          <img loading="lazy" src={avatarOf(m.displayName, m.avatarUrl)} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-[#2563EB]">{m.displayName}</span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {(m as { isSample?: boolean }).isSample ? 'บัญชีตัวอย่าง' : m.approvedHost ? 'โฮสต์ที่ทีมงานอนุมัติ' : m.trusted ? 'สมาชิกที่เชื่อถือได้' : 'ยืนยันแล้ว'} · {m.momentCount} โมเมนต์
                            </span>
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleFollowMember(m.id, m.displayName)}
                          aria-pressed={isFollowing}
                          className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                            isFollowing ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                          }`}
                        >
                          {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Widget 2: กิจกรรมแนะนำ (Recommended Activities) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#F26430] flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-none">กิจกรรมแนะนำ</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">เปิดรับสมัคร & น่าสนใจ</p>
                  </div>
                </div>
                <Link
                  href="/community"
                  className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 transition-colors group"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="space-y-2 pt-1">
                {recommendedEvents.map((ev) => {
                  const isCommunity = ev.eventType === 'community' || ev.id.startsWith('comm-');
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/80 cursor-pointer"
                    >
                      <div className="relative w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                        <img loading="lazy"
                          src={ev.image}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                              isCommunity
                                ? 'bg-[#FFF4EE] text-[#D04A1B]'
                                : 'bg-[#EEF4FA] text-[#1F3D5C]'
                            }`}
                          >
                            {isCommunity ? 'กิจกรรมชุมชน' : 'งานเอ็กซ์โป'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium truncate">
                            {ev.date}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#2563EB] truncate transition-colors">
                          {ev.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                          <span className="truncate max-w-[110px]">{ev.location}</span>
                          {isCommunity ? (
                            <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                              {ev.participantsCount}/{ev.maxParticipants} คน
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-500 shrink-0">
                              Walk-in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Widget 3: recommended challenges (posting a moment is how most challenges are completed) */}
            {sidebarQuests.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-none">ชาเลนจ์แนะนำ</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">ไปให้ครบ แชร์โมเมนต์ รับรางวัล</p>
                    </div>
                  </div>
                  <Link href="/challenges" className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 whitespace-nowrap">
                    <span>ดูทั้งหมด</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <ul className="space-y-4">
                  {sidebarQuests.slice(0, 3).map((q) => (
                    <li key={q.id}>
                      <QuestSuggestCard quest={q} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-2 mt-12 mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-900">
          <BrandLogo size="xs" />
          <span>Chill & Connect Hub</span>
        </div>
        <p className="font-medium text-slate-600">
          Hub กิจกรรมและคอมมูนิตี้สำหรับคนชอบออกไปใช้ชีวิต ที่เปลี่ยนทุกการไปเที่ยวให้เป็นเรื่องสนุกและต่อยอดมิตรภาพ
        </p>
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-500 pt-1 flex-wrap">
          <Link href="/about" className="hover:text-slate-800 hover:underline">เกี่ยวกับเรา</Link>
          <span className="text-slate-300">•</span>
          <Link href="/safety" className="hover:text-slate-800 hover:underline">คู่มือความปลอดภัย</Link>
          <span className="text-slate-300">•</span>
          <Link href="/legal" className="hover:text-slate-800 hover:underline">ข้อตกลงการใช้งาน</Link>
          <span className="text-slate-300">•</span>
          <Link href="/legal?tab=privacy" className="hover:text-slate-800 hover:underline">นโยบายความเป็นส่วนตัว</Link>
        </div>
        <p className="text-[11px] text-slate-400">© 2026 Chill & Connect Hub. All rights reserved.</p>
      </footer>

      {/* Mobile Floating Nav Bar */}
      <MobileNav
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        favoritesCount={eventFavorites.length + spotFavorites.length}
      />

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 animate-fade-in"
          onClick={() => setLightboxData(null)}
        >
          {/* Top Bar: Counter & Close */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white text-xs font-bold pt-2 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs">
              รูปที่ {lightboxData.index + 1} จาก {lightboxData.images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxData(null)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="ปิด (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image Container with Navigation Chevrons */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-auto overflow-hidden touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              viewerTouchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const start = viewerTouchX.current;
              viewerTouchX.current = null;
              if (start === null) return;
              const moved = e.changedTouches[0].clientX - start;
              if (Math.abs(moved) < 50) return;
              setLightboxData((prev) => (prev ? { ...prev, index: (prev.index + (moved < 0 ? 1 : -1) + prev.images.length) % prev.images.length } : null));
            }}
          >
            <img loading="lazy"
              src={lightboxData.images[lightboxData.index]}
              alt={`ภาพขยาย ${lightboxData.index + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl animate-scale-up"
            />

            {/* Left Chevron */}
            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxData((prev) => {
                    if (!prev) return null;
                    const newIdx = prev.index === 0 ? prev.images.length - 1 : prev.index - 1;
                    return { ...prev, index: newIdx };
                  })
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="รูปก่อนหน้า (ลูกศรซ้าย)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Chevron */}
            {lightboxData.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxData((prev) => {
                    if (!prev) return null;
                    const newIdx = prev.index === prev.images.length - 1 ? 0 : prev.index + 1;
                    return { ...prev, index: newIdx };
                  })
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="รูปถัดไป (ลูกศรขวา)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Caption & Thumbnails */}
          <div
            className="w-full max-w-5xl text-center space-y-2 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxData.caption && (
              <p className="text-white/80 text-xs sm:text-sm line-clamp-2 max-w-xl mx-auto font-normal">
                {lightboxData.caption}
              </p>
            )}

            {/* Thumbnails row */}
            {lightboxData.images.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                {lightboxData.images.map((thumb, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setLightboxData((prev) => prev ? { ...prev, index: tIdx } : null)}
                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      lightboxData.index === tIdx ? 'border-white scale-105' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img loading="lazy" src={thumb} alt={`Thumbnail ${tIdx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Spot Detail Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={Boolean(selectedSpot)}
        onClose={() => setSelectedSpot(null)}
        isFavorite={selectedSpot ? spotFavorites.includes(selectedSpot.id) : false}
        onToggleFavorite={(id) => {
          setSpotFavorites((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        }}
        isLoggedIn={isLoggedIn}
        onRequireLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Modal 2: Event Detail Modal (Community & Fairs) */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isFavorite={selectedEvent ? eventFavorites.includes(selectedEvent.id) : false}
        onToggleFavorite={(id) => {
          setEventFavorites((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        }}
        onJoinSuccess={() => showToast('เข้าร่วมกิจกรรมสำเร็จ!')}
      />


      {/* The share form, shared with the home feed */}
      {isCreateModalOpen && (
        <MomentComposer
          initial={composerInitial}
          onClose={() => setIsCreateModalOpen(false)}
          onToast={showToast}
          onPosted={(moment, counted) => {
            const createdPost = fromServerMoment(moment as unknown as ServerMoment);
            serverPostIds.current.add(createdPost.id);
            setPosts((prev) => [createdPost, ...prev]);
            setIsCreateModalOpen(false);
            if (counted) setCountedNotice(counted);
            else showToast('แชร์โมเมนต์ของคุณเรียบร้อยแล้ว');
          }}
        />
      )}


      {confirmDeleteId && (
        <DialogShell onClose={() => setConfirmDeleteId(null)} title="ลบโมเมนต์นี้ไหม" subtitle="รูป ข้อความ และความคิดเห็นของโพสต์นี้จะหายไป และกู้คืนไม่ได้" size="sm">
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setConfirmDeleteId(null)}>ยกเลิก</button>
            <button
              type="button"
              className={dialogButton.danger}
              disabled={isDialogBusy}
              onClick={async () => {
                setIsDialogBusy(true);
                await handleDeletePost(confirmDeleteId);
                setIsDialogBusy(false);
                setConfirmDeleteId(null);
              }}
            >
              ลบโมเมนต์
            </button>
          </div>
        </DialogShell>
      )}

      {reportPostId && (
        <DialogShell
          onClose={() => setReportPostId(null)}
          title="รายงานโพสต์นี้"
          subtitle="ทีมงานจะตรวจสอบ เจ้าของจะไม่รู้ว่าใครรายงาน"
          size="sm"
        >
          <fieldset className="space-y-2 mb-5">
            <legend className="sr-only">เหตุผล</legend>
            {['ชวนลงทุน ขายของ หรือขายประกัน', 'หลอกลวงหรือขอข้อมูลส่วนตัว', 'เนื้อหาไม่เหมาะสม', 'คุกคามหรือพูดจาไม่ดี', 'อื่นๆ'].map((reason) => (
              <label key={reason} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-sm font-semibold ${reportReason === reason ? 'border-[#2563EB] bg-blue-50/60 text-slate-900' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <input type="radio" name="report-reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="accent-[#2563EB]" />
                <span>{reason}</span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setReportPostId(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!reportReason || isDialogBusy} onClick={handleReportPost}>ส่งรายงาน</button>
          </div>
        </DialogShell>
      )}

      {editPost && (
        <DialogShell onClose={() => setEditPost(null)} title="แก้ไขข้อความ" size="sm">
          <label htmlFor="edit-moment-caption" className="sr-only">ข้อความของโมเมนต์</label>
          <textarea
            id="edit-moment-caption"
            rows={4}
            maxLength={500}
            value={editPost.caption}
            onChange={(e) => setEditPost({ ...editPost, caption: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none leading-relaxed mb-5"
          />
          <div className="flex flex-wrap justify-end gap-2.5">
            <button type="button" className={dialogButton.quiet} onClick={() => setEditPost(null)}>ยกเลิก</button>
            <button type="button" className={dialogButton.primary} disabled={!editPost.caption.trim() || isDialogBusy} onClick={handleSaveEdit}>บันทึก</button>
          </div>
        </DialogShell>
      )}


      {/* Create Custom Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreateSuccess={(newEvent) => {
          if (newEvent.approvalStatus === 'pending') {
            showToast(`ส่งข้อมูล "${newEvent.title}" เรียบร้อยแล้ว (รอตรวจสอบและอนุมัติโดยทีมงาน)`);
          } else {
            showToast(`สร้างกิจกรรม "${newEvent.title}" สำเร็จเรียบร้อย!`);
          }
        }}
      />

      {/* Free Membership Required Modal */}
      <RequireMembershipModal
        isOpen={isRequireMembershipOpen}
        onClose={() => setIsRequireMembershipOpen(false)}
        onOpenLogin={() => {
          setIsRequireMembershipOpen(false);
          setIsAuthModalOpen(true);
        }}
        actionTitle={membershipActionTitle}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(userName) => {
          handleSetIsLoggedIn(true);
          showToast(`ยินดีต้อนรับ ${userName}! เข้าสู่ระบบเรียบร้อย`);
        }}
      />

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={() => {
          handleSetIsLoggedIn(false);
          setIsLogoutModalOpen(false);
          showToast('ออกจากระบบเรียบร้อยแล้ว (Guest View)');
        }}
      />

      {/* Toast Notification */}
      {countedNotice && <CountedQuestNotice counted={countedNotice} onClose={() => setCountedNotice(null)} />}
      {toastMessage && (
        <div role="status" className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-[#1E293B] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function MomentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MomentsContent />
    </Suspense>
  );
}
