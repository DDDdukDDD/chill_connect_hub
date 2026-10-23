/**
 * A fixed copy of the landing's "เพื่อน & โมเมนต์" as it looked on 2026-10-23 (owner choice). FriendsMomentsWall
 * shows it while there are too few real moments with photos, so the section never looks empty after launch.
 * Names are illustrations; links from it go to /moments, never to these ids.
 */
export interface WallMoment {
  id: string;
  authorId: string | null;
  userName: string;
  userAvatar: string;
  images: string[];
  caption: string;
  location: string;
  targetTitle?: string;
  targetType?: string;
  targetId?: string;
  likesCount: number;
  commentsCount: number;
  timeAgo: string;
  comments: { userName: string; userAvatar: string; text: string; isMine: boolean }[];
}

export const LANDING_MOMENTS_SAMPLE: WallMoment[] = [
  {
    "id": "sample-post-spot-1",
    "authorId": null,
    "userName": "คุณกี้ (Kee_Explorer)",
    "userAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    "images": [
      "/hero-bkk-park-sunny.jpg",
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "เดินรับลมยามเย็นบน Skywalk สวนป่าเบญจกิติ แสงสีทองกระทบผิวน้ำสวยจนลืมความเหนื่อยล้าทั้งสัปดาห์เลย แนะนำมาช่วง 17:30 น. นะครับ",
    "location": "สวนป่าเบญจกิติ, คลองเตย",
    "targetTitle": "สวนป่าเบญจกิติ",
    "targetType": "spot",
    "targetId": "spot-bkk-1",
    "likesCount": 87,
    "commentsCount": 20,
    "timeAgo": "10 ต.ค. 2569",
    "comments": [
      {
        "userName": "แจน (Jan Specialty)",
        "userAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        "text": "แสงสวยมากเลยค่ะ ไปช่วงเย็นลมพัดสบายจริง",
        "isMine": false
      },
      {
        "userName": "บาส (Bas Running)",
        "userAvatar": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
        "text": "ตี้วิ่งเช้าก็ผ่านเส้นนี้ บรรยากาศดีมากๆ ครับ",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-general-1",
    "authorId": null,
    "userName": "คุณมิ้นท์ (Mint_Vibes)",
    "userAvatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    "images": [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "วันหยุดสบายๆ แวะมาเดินเล่นจิบกาแฟแถวอารีย์ แดดอุ่นๆ ลมพัดเย็นดีมาก ใครอยู่แถวนี้แวะมาทักทายกันได้นะ #กาแฟดริปดีมาก #มู้ดดีฮีลใจ",
    "location": "ซอยอารีย์",
    "targetTitle": "ซอยอารีย์",
    "likesCount": 53,
    "commentsCount": 1,
    "timeAgo": "9 ต.ค. 2569",
    "comments": [
      {
        "userName": "แพรวา (Praewa)",
        "userAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        "text": "ร้านน่ารักมาก กาแฟรสชาติดีไหมคะ",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-fair-1",
    "authorId": null,
    "userName": "คุณแพรว (Praew_Art)",
    "userAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    "images": [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "แวะมาเดินงาน Cat Expo ได้ยินเสียงดนตรีสดและได้ซื้อผลงานภาพพิมพ์จากศิลปินหน้าใหม่กลับบ้านด้วย มู้ดงานดีมาก คนเยอะแต่พลังงานบวกสุดๆ",
    "location": "ศูนย์ประชุมแห่งชาติสิริกิติ์ (QSNCC)",
    "targetTitle": "Cat Expo 2026: เทศกาลดนตรีและศิลปะอินดี้",
    "likesCount": 76,
    "commentsCount": 1,
    "timeAgo": "9 ต.ค. 2569",
    "comments": [
      {
        "userName": "วิน (Win Trekker)",
        "userAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        "text": "งานนี้จัดถึงกี่โมงเหรอครับ กำลังเล็งว่าจะแวะไปช่วงค่ำ",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-4",
    "authorId": null,
    "userName": "คุณฟ้า (Fah_Craft)",
    "userAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    "images": [
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "ขึ้นทรงแก้วกาแฟใบแรกในชีวิตสำเร็จแล้ว! ดินสัมผัสนุ่มละมุน สมาธิอยู่กับมือทุกวินาที รอลุ้นผลงานหลังเข้าเตาอบสัปดาห์หน้าเลย",
    "location": "อารีย์ สตูดิโอ คราฟต์",
    "targetTitle": "Pottery & Ceramic Workshop สตูดิโอปั้นดิน",
    "likesCount": 64,
    "commentsCount": 1,
    "timeAgo": "9 ต.ค. 2569",
    "comments": [
      {
        "userName": "กล้า (Kla Active)",
        "userAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        "text": "แก้วสวยมากเลยครับ ดูเนื้อดินละเอียดมาก",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-challenge-1",
    "authorId": null,
    "userName": "คุณแจน (Jan_Challenge)",
    "userAvatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    "images": [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "ส่งหลักฐานภาพถ่ายพิชิตสถานี Wall Balls ครบเซ็ตเรียบร้อย ปลดล็อกเหรียญตรา HYROX Warrior สำเร็จแล้ว เหนื่อยแต่ฟินสุดๆ!",
    "location": "HYROX Studio, สุขุมวิท 39",
    "targetTitle": "HYROX 4 Stations: พิชิต 4 สถานีฟิตเนสบูทแคมป์ระดับสากล",
    "likesCount": 95,
    "commentsCount": 0,
    "timeAgo": "9 ต.ค. 2569",
    "comments": []
  },
  {
    "id": "sample-post-1",
    "authorId": null,
    "userName": "คุณส้ม (Som_Chill)",
    "userAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    "images": [
      "/event-hyrox.png",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
    ],
    "caption": "ได้ลอง HYROX ครั้งแรกโหดแต่อารมณ์ดีสุดๆ! สลัดความเหนื่อยล้าด้วยพลังกลุ่มเพื่อนๆ โค้���ดูแลดีมาก ใครอยากขยับตัวลองมาซ้อมด้วยกันรอบหน้าครับ",
    "location": "HYROX Training Ground, สุขุมวิท 39 (BTS พร้อมพงษ์)",
    "targetTitle": "HYROX Community Workout & Functional Bootcamp สุขุมวิท 39",
    "likesCount": 42,
    "commentsCount": 2,
    "timeAgo": "9 ต.ค. 2569",
    "comments": [
      {
        "userName": "คุณต้น (Ton_Runner)",
        "userAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        "text": "เหนื่อยสถานี Sled Push มากครับ แต่สนุกสุดๆ รอบหน้าไปอีกแน่!",
        "isMine": false
      },
      {
        "userName": "คุณพลอย (Ploy_Mind)",
        "userAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        "text": "อยากไปลองจอยบ้างจังเลยค่ะ มือใหม่ไหวไหมคะ?",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-2",
    "authorId": null,
    "userName": "คุณเอก (Eak_Mindfulness)",
    "userAvatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    "images": [
      "/event-sound-bath.png"
    ],
    "caption": "หลับลึกและเบาสมองมากหลังจากฟังคลื่นเสียง Singing Bowls 2 ชั่วโมงเต็ม ได้เพื่อนใหม่สาย Introvert น่ารักๆ เพิ่มขึ้นเยอะเลยครับ",
    "location": "Introvert-friendly, พระราม 9",
    "targetTitle": "Sound Bath Meditation Rama 9 สมาธิเสียงคลื่น พระราม 9",
    "likesCount": 58,
    "commentsCount": 1,
    "timeAgo": "8 ต.ค. 2569",
    "comments": [
      {
        "userName": "คุณเมย์ (May_Coffee)",
        "userAvatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
        "text": "ยินดีที่ได้รู้จักทุกคนในคลาสเมื่อวานนะคะ บรรยากาศอบอุ่นมาก",
        "isMine": false
      }
    ]
  },
  {
    "id": "sample-post-3",
    "authorId": null,
    "userName": "คุณเบส (Best_Gamer)",
    "userAvatar": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    "images": [
      "/event-board-games.png"
    ],
    "caption": "คืนบอร์ดเกมเมื่อคืนเล่น Catan กับเพื่อนใหม่ลากยาวถึงสี่ทุ่ม ฮาจนท้องแข็ง ไว้สัปดาห์หน้าเจอกันใหม่น้าทุกคน!",
    "location": "คืนบอร์ดเกม อโศก",
    "targetTitle": "Board Game Night Asoke คืนบอร์ดเกม อโศก",
    "likesCount": 35,
    "commentsCount": 0,
    "timeAgo": "8 ต.ค. 2569",
    "comments": []
  }
];
