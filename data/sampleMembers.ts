/**
 * SAMPLE DATA (development only, remove before launch).
 * Profiles for the authors of the bundled sample moments (MOCK_POSTS), keyed by the handle in
 * their display name, e.g. "คุณกี้ (Kee_Explorer)" → Kee_Explorer.
 * lib/members/sampleMembers.ts turns each one into a sample account (isSample) that cannot sign in.
 */
export interface SampleMemberProfile {
  gender: 'female' | 'male' | 'lgbtq';
  birthYear: number;
  occupation: string;
  bio: string;
  livingArea: string;
  hometown: string;
  education: string;
  connectGoal: string;
  /** ids of master-data community categories */
  interests: string[];
}

export const SAMPLE_MEMBER_PROFILES: Record<string, SampleMemberProfile> = {
  Kee_Explorer: { gender: 'male', birthYear: 1992, occupation: 'นักวางแผนการตลาด', bio: 'ชอบเดินสวนตอนเย็นหลังเลิกงาน หามุมสงบในเมืองไปเรื่อยๆ', livingArea: 'คลองเตย กรุงเทพฯ', hometown: 'เชียงใหม่', education: 'ปริญญาตรี บริหารธุรกิจ', connectGoal: 'เพื่อนเดินสวนและวิ่งเบาๆ ช่วงเย็น', interests: ['running_fitness', 'wellness_mind'] },
  Mint_Vibes: { gender: 'female', birthYear: 1996, occupation: 'กราฟิกดีไซเนอร์', bio: 'ตระเวนคาเฟ่ย่านอารีย์ทุกเสาร์ ชอบร้านเล็กๆ ที่เจ้าของชงเอง', livingArea: 'อารีย์ กรุงเทพฯ', hometown: 'กรุงเทพฯ', education: 'ปริญญาตรี นิเทศศิลป์', connectGoal: 'เพื่อนไปคาเฟ่และถ่ายรูปเล่น', interests: ['cafe_social', 'arts_crafts'] },
  Praew_Art: { gender: 'female', birthYear: 1994, occupation: 'นักวาดภาพประกอบ', bio: 'ไปงานศิลปะและงานแฟร์แทบทุกเดือน ชอบคุยกับศิลปินหน้าบูธ', livingArea: 'ห้วยขวาง กรุงเทพฯ', hometown: 'ขอนแก่น', education: 'ปริญญาตรี ศิลปกรรม', connectGoal: 'คนที่ชอบเดินงานอาร์ตด้วยกัน', interests: ['arts_crafts'] },
  Fah_Craft: { gender: 'female', birthYear: 1995, occupation: 'เจ้าของร้านงานคราฟต์ออนไลน์', bio: 'ทำเซรามิกและงานปักเป็นงานอดิเรกที่กลายเป็นอาชีพ', livingArea: 'อารีย์ กรุงเทพฯ', hometown: 'ลำปาง', education: 'ปริญญาตรี ออกแบบผลิตภัณฑ์', connectGoal: 'เพื่อนทำเวิร์กช็อปงานมือ', interests: ['arts_crafts', 'cafe_social'] },
  Jan_Challenge: { gender: 'female', birthYear: 1993, occupation: 'นักวิเคราะห์ข้อมูล', bio: 'ติดการตั้งเป้าแล้วทำให้สำเร็จ ตอนนี้ซ้อม HYROX อยู่', livingArea: 'สุขุมวิท กรุงเทพฯ', hometown: 'นครราชสีมา', education: 'ปริญญาโท สถิติ', connectGoal: 'คู่ซ้อมที่มาสม่ำเสมอ', interests: ['running_fitness', 'running_fitness'] },
  Som_Chill: { gender: 'female', birthYear: 1997, occupation: 'พนักงานฝ่ายบุคคล', bio: 'ออกกำลังกายแบบไม่กดดันตัวเอง ชอบชวนเพื่อนใหม่ไปลองคลาส', livingArea: 'พร้อมพงษ์ กรุงเทพฯ', hometown: 'ชลบุรี', education: 'ปริญญาตรี จิตวิทยา', connectGoal: 'เพื่อนไปลองคลาสออกกำลังกายใหม่ๆ', interests: ['running_fitness', 'wellness_mind'] },
  Eak_Mindfulness: { gender: 'male', birthYear: 1989, occupation: 'วิศวกรซอฟต์แวร์', bio: 'เป็นคนเงียบๆ ชอบกิจกรรมกลุ่มเล็กที่ไม่ต้องพูดเยอะ', livingArea: 'พระราม 9 กรุงเทพฯ', hometown: 'พิษณุโลก', education: 'ปริญญาตรี วิศวกรรมคอมพิวเตอร์', connectGoal: 'กลุ่มเล็กๆ ที่นั่งสมาธิหรือฟังเสียงบำบัด', interests: ['wellness_mind', 'tech_skills'] },
  Best_Gamer: { gender: 'male', birthYear: 1995, occupation: 'นักพัฒนาเกม', bio: 'สะสมบอร์ดเกมเกือบร้อยกล่อง ยินดีสอนคนที่ไม่เคยเล่น', livingArea: 'อโศก กรุงเทพฯ', hometown: 'กรุงเทพฯ', education: 'ปริญญาตรี วิทยาการคอมพิวเตอร์', connectGoal: 'ตี้บอร์ดเกมคืนวันศุกร์', interests: ['boardgames_party', 'tech_skills'] },
  Dan_Acoustic: { gender: 'male', birthYear: 1991, occupation: 'นักดนตรีอิสระ', bio: 'เล่นกีตาร์โปร่งตามร้านเล็กๆ ชอบคืนที่คนฟังตั้งใจฟัง', livingArea: 'ทองหล่อ กรุงเทพฯ', hometown: 'สงขลา', education: 'ปริญญาตรี ดุริยางคศาสตร์', connectGoal: 'คนรักดนตรีสดและวงเล็กๆ', interests: ['cafe_social', 'arts_crafts'] },
  Nat_Yoga: { gender: 'female', birthYear: 1990, occupation: 'ครูสอนโยคะ', bio: 'สอนโยคะในสวนตอนเช้า เชื่อว่าการหายใจดีแก้ได้หลายเรื่อง', livingArea: 'ปทุมวัน กรุงเทพฯ', hometown: 'ภูเก็ต', education: 'ปริญญาตรี วิทยาศาสตร์การกีฬา', connectGoal: 'คนที่อยากเริ่มโยคะแต่ยังไม่กล้า', interests: ['wellness_mind', 'running_fitness'] },
  Kong_Barista: { gender: 'male', birthYear: 1993, occupation: 'บาริสต้า', bio: 'คั่วกาแฟเองที่บ้าน ชอบเล่าเรื่องเมล็ดให้คนที่ถาม', livingArea: 'เอกมัย กรุงเทพฯ', hometown: 'เชียงราย', education: 'ปริญญาตรี การจัดการธุรกิจอาหาร', connectGoal: 'คนชอบกาแฟที่อยากลองชิมเปรียบเทียบ', interests: ['cafe_social'] },
  Pond_Runner: { gender: 'male', birthYear: 1994, occupation: 'พนักงานธนาคาร', bio: 'วิ่งเช้าก่อนเข้างานสัปดาห์ละสี่วัน เพซสบายๆ คุยไปวิ่งไปได้', livingArea: 'พระราม 9 กรุงเทพฯ', hometown: 'อุดรธานี', education: 'ปริญญาตรี เศรษฐศาสตร์', connectGoal: 'เพื่อนวิ่งเช้าเพซ 6-7', interests: ['running_fitness', 'running_fitness'] },
  Mew_Aroma: { gender: 'female', birthYear: 1996, occupation: 'นักปรุงกลิ่น', bio: 'ทำเทียนหอมและน้ำหอมขวดเล็ก ชอบกลิ่นไม้และชา', livingArea: 'อารีย์ กรุงเทพฯ', hometown: 'กรุงเทพฯ', education: 'ปริญญาตรี เคมี', connectGoal: 'เพื่อนทำเวิร์กช็อปกลิ่นและงานคราฟต์', interests: ['arts_crafts', 'wellness_mind'] },
  Win_FilmPhoto: { gender: 'male', birthYear: 1992, occupation: 'ช่างภาพอิสระ', bio: 'ถ่ายฟิล์มตามย่านเก่า เดินช้าๆ ทั้งวันได้ไม่เบื่อ', livingArea: 'เจริญกรุง กรุงเทพฯ', hometown: 'นครปฐม', education: 'ปริญญาตรี ภาพยนตร์และภาพถ่าย', connectGoal: 'เพื่อนเดินถ่ายรูปย่านเก่า', interests: ['arts_crafts', 'cafe_social'] },
  Joy_StandUp: { gender: 'female', birthYear: 1993, occupation: 'นักเขียนคอนเทนต์', bio: 'ไปดูสแตนด์อัปเกือบทุกเดือน บางคืนก็ขึ้นเวทีเปิดไมค์เอง', livingArea: 'เอกมัย กรุงเทพฯ', hometown: 'ระยอง', education: 'ปริญญาตรี อักษรศาสตร์', connectGoal: 'คนที่ชอบหัวเราะและไม่ถือสา', interests: ['cafe_social', 'boardgames_party'] },
  Pete_SUPBoard: { gender: 'male', birthYear: 1990, occupation: 'สถาปนิก', bio: 'พายซับบอร์ดตอนพระอาทิตย์ตก ชอบเห็นเมืองจากกลางน้ำ', livingArea: 'บางพลัด กรุงเทพฯ', hometown: 'กระบี่', education: 'ปริญญาตรี สถาปัตยกรรม', connectGoal: 'เพื่อนพายซับบอร์ดช่วงเย็น', interests: ['running_fitness', 'wellness_mind'] },
  Ohm_Climber: { gender: 'male', birthYear: 1996, occupation: 'นักกายภาพบำบัด', bio: 'ปีนผามาสามปี ชอบพาคนใหม่ขึ้นเส้นแรก', livingArea: 'สุขุมวิท กรุงเทพฯ', hometown: 'กาญจนบุรี', education: 'ปริญญาตรี กายภาพบำบัด', connectGoal: 'บัดดี้ปีนผาที่ไว้ใจกันได้', interests: ['running_fitness', 'running_fitness'] },
  Pang_BookWorm: { gender: 'female', birthYear: 1995, occupation: 'บรรณาธิการ', bio: 'อ่านหนังสือเดือนละสี่เล่ม ชอบวงคุยหนังสือกลุ่มเล็ก', livingArea: 'อารีย์ กรุงเทพฯ', hometown: 'อยุธยา', education: 'ปริญญาตรี วรรณคดี', connectGoal: 'เพื่อนอ่านหนังสือเงียบๆ ในคาเฟ่', interests: ['cafe_social', 'arts_crafts'] },
  Boat_Camper: { gender: 'male', birthYear: 1991, occupation: 'ผู้จัดการโครงการ', bio: 'กางเต็นท์เกือบทุกเดือน ชอบลานที่เงียบและเห็นดาว', livingArea: 'ลาดพร้าว กรุงเทพฯ', hometown: 'นครนายก', education: 'ปริญญาตรี วิศวกรรมโยธา', connectGoal: 'เพื่อนแคมป์ที่ช่วยกันทำกับข้าว', interests: ['wellness_mind', 'running_fitness'] },
  Grace_Green: { gender: 'female', birthYear: 1994, occupation: 'นักจัดสวน', bio: 'ปลูกต้นไม้เต็มระเบียงคอนโด ชอบแลกกิ่งชำกับคนอื่น', livingArea: 'จตุจักร กรุงเทพฯ', hometown: 'นนทบุรี', education: 'ปริญญาตรี พืชสวน', connectGoal: 'คนรักต้นไม้ที่อยากแลกต้นกัน', interests: ['arts_crafts', 'wellness_mind'] },
  Ben_Sourdough: { gender: 'male', birthYear: 1988, occupation: 'เชฟขนมปัง', bio: 'อบซาวร์โดว์มาเจ็ดปี เลี้ยงหัวเชื้อเหมือนเลี้ยงลูก', livingArea: 'สีลม กรุงเทพฯ', hometown: 'กรุงเทพฯ', education: 'ประกาศนียบัตร ศิลปะการประกอบอาหาร', connectGoal: 'คนที่อยากหัดอบขนมปังที่บ้าน', interests: ['arts_crafts', 'cafe_social'] },
  Mint_Pilates: { gender: 'female', birthYear: 1992, occupation: 'ครูสอนพิลาทิส', bio: 'เชื่อเรื่องการขยับร่างกายอย่างเข้าใจ มากกว่าการหักโหม', livingArea: 'ชิดลม กรุงเทพฯ', hometown: 'หัวหิน', education: 'ปริญญาตรี วิทยาศาสตร์การกีฬา', connectGoal: 'คนทำงานออฟฟิศที่ปวดหลังและอยากเริ่มขยับ', interests: ['wellness_mind', 'running_fitness'] },
  Art_Rooftop: { gender: 'male', birthYear: 1993, occupation: 'อาร์ตไดเรกเตอร์', bio: 'ชอบงานศิลปะบนดาดฟ้าและเพลงเบาๆ ตอนพระอาทิตย์ตก', livingArea: 'สุขุมวิท กรุงเทพฯ', hometown: 'เชียงใหม่', education: 'ปริญญาตรี ออกแบบสื่อสาร', connectGoal: 'เพื่อนไปงานเปิดนิทรรศการ', interests: ['arts_crafts', 'cafe_social'] },
  May_Calligraphy: { gender: 'female', birthYear: 1997, occupation: 'นักออกแบบตัวอักษร', bio: 'เขียนคัลลิกราฟีเป็นการพักสมอง ชอบกระดาษดีๆ และหมึกสีเข้ม', livingArea: 'พญาไท กรุงเทพฯ', hometown: 'สุโขทัย', education: 'ปริญญาตรี ออกแบบกราฟิก', connectGoal: 'เพื่อนนั่งเขียนตัวอักษรเงียบๆ ด้วยกัน', interests: ['arts_crafts'] },
};
