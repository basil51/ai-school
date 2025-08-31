import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { getToken } from 'next-auth/jwt';

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      organizationId,
    };

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (date) {
      whereClause.date = new Date(date);
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        recordedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(toSerializable(attendance));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      studentId,
      date,
      status,
      checkInTime,
      checkOutTime,
      notes,
    } = body;

    if (!organizationId || !studentId || !date) {
      return NextResponse.json(
        { error: 'Organization ID, student ID, and date are required' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this student and date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date),
        },
      },
    });

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: {
          id: existingAttendance.id,
        },
        data: {
          status,
          checkInTime: checkInTime ? new Date(checkInTime) : null,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
          notes,
          recordedBy: token.sub,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          recordedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          organizationId,
          studentId,
          date: new Date(date),
          status,
          checkInTime: checkInTime ? new Date(checkInTime) : null,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
          notes,
          recordedBy: token.sub,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          recordedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json(toSerializable(attendance));
  } catch (error) {
    console.error('Error creating/updating attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update attendance
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, date, attendanceRecords } = body;

    if (!organizationId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json(
        { error: 'Organization ID, date, and attendance records array are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const record of attendanceRecords) {
      const { studentId, status, checkInTime, checkOutTime, notes } = record;

      if (!studentId || !status) {
        continue;
      }

      try {
        const existingAttendance = await prisma.attendance.findUnique({
          where: {
            studentId_date: {
              studentId,
              date: new Date(date),
            },
          },
        });

        let attendance;
        if (existingAttendance) {
          attendance = await prisma.attendance.update({
            where: {
              id: existingAttendance.id,
            },
            data: {
              status,
              checkInTime: checkInTime ? new Date(checkInTime) : null,
              checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
              notes,
              recordedBy: token.sub,
            },
          });
        } else {
          attendance = await prisma.attendance.create({
            data: {
              organizationId,
              studentId,
              date: new Date(date),
              status,
              checkInTime: checkInTime ? new Date(checkInTime) : null,
              checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
              notes,
              recordedBy: token.sub,
            },
          });
        }

        results.push(attendance);
      } catch (error) {
        console.error(`Error processing attendance for student ${studentId}:`, error);
        results.push({ error: `Failed to process student ${studentId}` });
      }
    }

    return NextResponse.json(toSerializable(results));
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
