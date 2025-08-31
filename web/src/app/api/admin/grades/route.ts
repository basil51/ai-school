import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';
import { getToken } from 'next-auth/jwt';

// GET - Fetch grades, assignments, and categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type'); // 'grades', 'assignments', 'categories'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    switch (type) {
      case 'categories':
        const categories = await prisma.gradeCategory.findMany({
          where: { organizationId, isActive: true },
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                grades: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });
        return NextResponse.json(toSerializable(categories));

      case 'assignments':
        const whereClause: any = { organizationId, isActive: true };
        if (categoryId) whereClause.categoryId = categoryId;

        const assignments = await prisma.assignment.findMany({
          where: whereClause,
          include: {
            category: true,
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            grades: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                gradedByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { dueDate: 'desc' },
        });
        return NextResponse.json(toSerializable(assignments));

      case 'grades':
      default:
        const gradesWhereClause: any = { organizationId };
        if (studentId) gradesWhereClause.studentId = studentId;
        if (assignmentId) gradesWhereClause.assignmentId = assignmentId;

        const grades = await prisma.grade.findMany({
          where: gradesWhereClause,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            assignment: {
              include: {
                category: true,
              },
            },
            gradedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { gradedAt: 'desc' },
        });
        return NextResponse.json(toSerializable(grades));
    }
  } catch (error) {
    console.error('Error fetching grades data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create grade category
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'category':
        const { organizationId, name, description, weight, color } = data;
        
        if (!organizationId || !name) {
          return NextResponse.json(
            { error: 'Organization ID and name are required' },
            { status: 400 }
          );
        }

        const category = await prisma.gradeCategory.create({
          data: {
            organizationId,
            name,
            description,
            weight: weight || 1.0,
            color: color || '#3b82f6',
          },
        });
        return NextResponse.json(toSerializable(category));

      case 'assignment':
        const { 
          organizationId: orgId, 
          categoryId, 
          title, 
          description: assignmentDescription, 
          dueDate, 
          totalPoints 
        } = data;
        
        if (!orgId || !categoryId || !title) {
          return NextResponse.json(
            { error: 'Organization ID, category ID, and title are required' },
            { status: 400 }
          );
        }

        const assignment = await prisma.assignment.create({
          data: {
            organizationId: orgId,
            categoryId,
            title,
            description: assignmentDescription,
            dueDate: dueDate ? new Date(dueDate) : null,
            totalPoints: totalPoints || 100.0,
            createdBy: token.sub,
          },
          include: {
            category: true,
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        return NextResponse.json(toSerializable(assignment));

      case 'grade':
        const { 
          organizationId: gradeOrgId, 
          studentId, 
          assignmentId, 
          score, 
          maxScore, 
          feedback 
        } = data;
        
        if (!gradeOrgId || !studentId || !assignmentId || score === undefined) {
          return NextResponse.json(
            { error: 'Organization ID, student ID, assignment ID, and score are required' },
            { status: 400 }
          );
        }

        const maxPoints = maxScore || 100.0;
        const percentage = (score / maxPoints) * 100;
        const letterGrade = calculateLetterGrade(percentage);

        const grade = await prisma.grade.create({
          data: {
            organizationId: gradeOrgId,
            studentId,
            assignmentId,
            score,
            maxScore: maxPoints,
            percentage,
            letterGrade,
            feedback,
            gradedBy: token.sub,
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
            assignment: {
              include: {
                category: true,
              },
            },
            gradedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        return NextResponse.json(toSerializable(grade));

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be "category", "assignment", or "grade"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error creating grade data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update grade data
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    switch (type) {
      case 'category':
        const category = await prisma.gradeCategory.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            weight: data.weight,
            color: data.color,
          },
        });
        return NextResponse.json(toSerializable(category));

      case 'assignment':
        const assignment = await prisma.assignment.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            totalPoints: data.totalPoints,
          },
          include: {
            category: true,
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        return NextResponse.json(toSerializable(assignment));

      case 'grade':
        const maxPoints = data.maxScore || 100.0;
        const percentage = (data.score / maxPoints) * 100;
        const letterGrade = calculateLetterGrade(percentage);

        const grade = await prisma.grade.update({
          where: { id },
          data: {
            score: data.score,
            maxScore: maxPoints,
            percentage,
            letterGrade,
            feedback: data.feedback,
            gradedBy: token.sub,
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
            assignment: {
              include: {
                category: true,
              },
            },
            gradedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        return NextResponse.json(toSerializable(grade));

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be "category", "assignment", or "grade"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating grade data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete grade data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'category':
        await prisma.gradeCategory.update({
          where: { id },
          data: { isActive: false },
        });
        break;

      case 'assignment':
        await prisma.assignment.update({
          where: { id },
          data: { isActive: false },
        });
        break;

      case 'grade':
        await prisma.grade.delete({
          where: { id },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be "category", "assignment", or "grade"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grade data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate letter grade
function calculateLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}
