import { NextResponse } from 'next/server';
import { runScraperAndAIEngine } from '@/lib/eventsStore';

export async function POST() {
  try {
    const result = await runScraperAndAIEngine();
    
    let message = '';
    if (result.newCount > 0) {
      message = `ดึงข้อมูลสำเร็จ! พบกิจกรรมใหม่ ${result.newCount} รายการ (ระบบคัดกรองข้ามรายการที่ซ้ำ ${result.duplicateCount} รายการอัตโนมัติ)`;
    } else {
      message = `สแกนเรียบร้อย! ข้อมูลอีเวนต์เป็นปัจจุบันแล้ว (ข้าม ${result.duplicateCount} รายการที่มีอยู่ในระบบแล้ว)`;
    }

    return NextResponse.json({
      success: true,
      message,
      newCount: result.newCount,
      duplicateCount: result.duplicateCount,
      duplicateDetails: result.duplicateDetails,
      events: result.events,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
