import { PrismaClient, Role, OrganizationTier, SubjectLevel, DifficultyLevel, AssessmentType, QuestionType, ProgressStatus, AttendanceStatus, PerformancePeriod, PathwayType, InterventionType, EmailFrequency, ReportFrequency, ReportFormat, MessageType, GuardianRelationshipStatus, EmailStatus, FailureType, PaceLevel } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Create default organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo-school",
      description: "Default demonstration school organization",
      tier: OrganizationTier.premium,
      primaryColor: "#2563eb",
      settings: {
        create: {
          maxUsers: 500,
          maxDocuments: 100,
          maxQuestionsPerMonth: 10000,
          maxStorageBytes: BigInt(10 * 1024 * 1024 * 1024), // 10GB
          evaluationsEnabled: true,
          ragEnabled: true,
          guardianEmailsEnabled: true,
        },
      },
    },
  });

  console.log('✅ Created default organization');

  // Create users with different roles
  const users = [
    { email: "superadmin@example.com", role: Role.super_admin, name: "Super Admin", pass: "super123", orgId: null },
    { email: "admin@example.com", role: Role.admin, name: "Admin", pass: "admin123", orgId: defaultOrg.id },
    { email: "teacher@example.com", role: Role.teacher, name: "Teacher Tina", pass: "teach123", orgId: defaultOrg.id },
    { email: "student@example.com", role: Role.student, name: "Student Sam", pass: "study123", orgId: defaultOrg.id },
    { email: "guardian@example.com", role: Role.guardian, name: "Guardian Grace", pass: "guard123", orgId: defaultOrg.id },
    { email: "student2@example.com", role: Role.student, name: "Student Sarah", pass: "study123", orgId: defaultOrg.id },
    { email: "guardian2@example.com", role: Role.guardian, name: "Guardian George", pass: "guard123", orgId: defaultOrg.id },
    { email: "student3@example.com", role: Role.student, name: "Student Alex", pass: "study123", orgId: defaultOrg.id },
  ];

  const createdUsers = [];
  for (const u of users) {
    const hash = await argon2.hash(u.pass, { type: argon2.argon2id });
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        email: u.email, 
        name: u.name, 
        role: u.role, 
        password: hash,
        organizationId: u.orgId,
      },
    });
    createdUsers.push(user);
  }
  console.log('✅ Created users');

  // Create guardian-student relationships
  const relationships = [
    { guardianEmail: "guardian@example.com", studentEmail: "student@example.com" },
    { guardianEmail: "guardian2@example.com", studentEmail: "student2@example.com" },
  ];

  for (const rel of relationships) {
    const guardian = await prisma.user.findUnique({ where: { email: rel.guardianEmail } });
    const student = await prisma.user.findUnique({ where: { email: rel.studentEmail } });
    
    if (guardian && student) {
      await prisma.guardianRelationship.upsert({
        where: {
          guardianId_studentId: {
            guardianId: guardian.id,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          guardianId: guardian.id,
          studentId: student.id,
          status: GuardianRelationshipStatus.approved,
        },
      });
    }
  }
  console.log('✅ Created guardian relationships');

  // Create email preferences for users
  for (const user of createdUsers) {
    await prisma.emailPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        weeklyProgressEnabled: true,
        emailFrequency: EmailFrequency.weekly,
      },
    });
  }
  console.log('✅ Created email preferences');

  // Create email templates
  const templates = [
    {
      name: 'weekly_progress',
      subject: 'Weekly Progress Report for {{studentName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Progress Report</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Weekly Progress Report</h2>
            <p>Dear {{guardianName}},</p>
            <p>Here's a summary of {{studentName}}'s learning progress this week:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📊 This Week's Activity</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;">📚 <strong>Sessions completed:</strong> {{sessionsCount}}</li>
                <li style="margin: 10px 0;">❓ <strong>Questions asked:</strong> {{questionsAsked}}</li>
                <li style="margin: 10px 0;">⏱️ <strong>Time spent learning:</strong> {{timeSpent}}</li>
                <li style="margin: 10px 0;">📖 <strong>Topics covered:</strong> {{topicsCovered}}</li>
              </ul>
            </div>
            
            <p>Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>The EduVibe Team</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Weekly Progress Report
        
        Dear {{guardianName}},
        
        Here's a summary of {{studentName}}'s learning progress this week:
        
        This Week's Activity:
        - Sessions completed: {{sessionsCount}}
        - Questions asked: {{questionsAsked}}
        - Time spent learning: {{timeSpent}}
        - Topics covered: {{topicsCovered}}
        
        Keep up the great work! If you have any questions about {{studentName}}'s progress, please don't hesitate to reach out.
        
        Best regards,
        The EduVibe Team
      `,
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log('✅ Created email templates');

  // Create subjects
  const mathSubject = await prisma.subject.upsert({
    where: { 
      organizationId_name: {
        organizationId: defaultOrg.id,
        name: 'Mathematics'
      }
    },
    update: {},
    create: {
      name: 'Mathematics',
      description: 'A comprehensive course covering fundamental mathematical concepts and problem-solving skills',
      level: SubjectLevel.high,
      organizationId: defaultOrg.id,
      isActive: true
    }
  });

  const physicsSubject = await prisma.subject.upsert({
    where: { 
      organizationId_name: {
        organizationId: defaultOrg.id,
        name: 'Physics'
      }
    },
    update: {},
    create: {
      name: 'Physics',
      description: 'Study of matter, energy, and their interactions in the universe',
      level: SubjectLevel.high,
      organizationId: defaultOrg.id,
      isActive: true
    }
  });

  const historySubject = await prisma.subject.upsert({
    where: { 
      organizationId_name: {
        organizationId: defaultOrg.id,
        name: 'History'
      }
    },
    update: {},
    create: {
      name: 'History',
      description: 'Study of past events and their impact on the present',
      level: SubjectLevel.high,
      organizationId: defaultOrg.id,
      isActive: true
    }
  });

  console.log('✅ Created subjects');

  // Create topics
  const algebraTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathSubject.id,
        name: 'Algebra'
      }
    },
    update: {},
    create: {
      name: 'Algebra',
      description: 'Introduction to algebraic concepts and equations',
      order: 1,
      subjectId: mathSubject.id,
      isActive: true
    }
  });

  const geometryTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathSubject.id,
        name: 'Geometry'
      }
    },
    update: {},
    create: {
      name: 'Geometry',
      description: 'Study of shapes, sizes, and properties of figures',
      order: 2,
      subjectId: mathSubject.id,
      isActive: true
    }
  });

  const mechanicsTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: physicsSubject.id,
        name: 'Mechanics'
      }
    },
    update: {},
    create: {
      name: 'Mechanics',
      description: 'Study of motion and forces',
      order: 1,
      subjectId: physicsSubject.id,
      isActive: true
    }
  });

  console.log('✅ Created topics');

  // Create lessons
  const lessons = [
    {
      title: 'Introduction to Variables',
      content: `Variables are symbols that represent unknown values in mathematics. They are typically represented by letters like x, y, or z.

In algebra, we use variables to:
- Represent unknown quantities
- Create general formulas
- Solve problems with multiple unknowns

For example, if we say "x + 5 = 10", the variable x represents an unknown number that, when added to 5, equals 10.`,
      objectives: [
        'Understand what variables represent',
        'Identify variables in mathematical expressions',
        'Solve simple equations with variables'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 30,
      order: 1,
      topicId: algebraTopic.id
    },
    {
      title: 'Linear Equations',
      content: `Linear equations are equations where the variable is raised only to the first power (no squares, cubes, etc.).

The general form of a linear equation is: ax + b = c
Where a, b, and c are numbers, and x is the variable.

To solve linear equations:
1. Combine like terms on each side
2. Move all terms with variables to one side
3. Move all constant terms to the other side
4. Divide both sides by the coefficient of the variable`,
      objectives: [
        'Identify linear equations',
        'Solve linear equations step by step',
        'Apply the rules of equation solving'
      ],
      difficulty: DifficultyLevel.intermediate,
      estimatedTime: 45,
      order: 2,
      topicId: algebraTopic.id
    },
    {
      title: 'Basic Geometric Shapes',
      content: `Geometry is the branch of mathematics that deals with shapes, sizes, and properties of figures.

Basic geometric shapes include:
1. Triangle - 3 sides
2. Square - 4 equal sides, 4 right angles
3. Rectangle - 4 sides, 4 right angles
4. Circle - all points equidistant from center`,
      objectives: [
        'Identify basic geometric shapes',
        'Understand properties of different shapes',
        'Recognize regular and irregular polygons'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 25,
      order: 1,
      topicId: geometryTopic.id
    },
    {
      title: 'Introduction to Motion',
      content: `Motion is the change in position of an object over time.

Key concepts:
1. Distance - total path length traveled
2. Displacement - change in position (vector quantity)
3. Speed - distance traveled per unit time
4. Velocity - displacement per unit time (vector quantity)
5. Acceleration - rate of change of velocity`,
      objectives: [
        'Understand basic motion concepts',
        'Distinguish between distance and displacement',
        'Calculate average speed'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 35,
      order: 1,
      topicId: mechanicsTopic.id
    }
  ];

  const createdLessons = [];
  for (const lessonData of lessons) {
    const lesson = await prisma.lesson.upsert({
      where: {
        topicId_title: {
          topicId: lessonData.topicId,
          title: lessonData.title
        }
      },
      update: {},
      create: {
        ...lessonData,
        isActive: true
      }
    });
    createdLessons.push(lesson);
  }
  console.log('✅ Created lessons');

  // Create student enrollments
  const students = createdUsers.filter(u => u.role === Role.student);
  const subjects = [mathSubject, physicsSubject, historySubject];
  
  for (const student of students) {
    for (const subject of subjects) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentId_subjectId: {
            studentId: student.id,
            subjectId: subject.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          subjectId: subject.id,
          isActive: true
        }
      });
    }
  }
  console.log('✅ Created student enrollments');

  // Create student progress
  for (const student of students) {
    for (const lesson of createdLessons) {
      const statuses = [ProgressStatus.not_started, ProgressStatus.in_progress, ProgressStatus.completed];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      await prisma.studentProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId: student.id,
            lessonId: lesson.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          lessonId: lesson.id,
          status: randomStatus,
          startedAt: randomStatus !== ProgressStatus.not_started ? new Date() : null,
          completedAt: randomStatus === ProgressStatus.completed ? new Date() : null,
          timeSpent: Math.floor(Math.random() * 60) + 10,
          attempts: Math.floor(Math.random() * 3) + 1
        }
      });
    }
  }
  console.log('✅ Created student progress');

  // Create student profiles
  for (const student of students) {
    await prisma.studentProfile.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        learningStyle: {
          visual: Math.random() * 0.8 + 0.2,
          auditory: Math.random() * 0.8 + 0.2,
          kinesthetic: Math.random() * 0.8 + 0.2,
          reading: Math.random() * 0.8 + 0.2
        },
        preferredPace: PaceLevel.moderate,
        strengthAreas: ['Mathematics', 'Problem Solving'],
        weaknessAreas: ['History', 'Writing'],
        motivationLevel: Math.random() * 0.4 + 0.6
      }
    });
  }
  console.log('✅ Created student profiles');

  // Create assessments
  const assessments = [];
  for (const lesson of createdLessons) {
    // Check if assessment already exists
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        lessonId: lesson.id,
        title: `${lesson.title} Quiz`
      }
    });

    let assessment;
    if (existingAssessment) {
      assessment = existingAssessment;
    } else {
      assessment = await prisma.assessment.create({
        data: {
          lessonId: lesson.id,
          type: AssessmentType.quiz,
          title: `${lesson.title} Quiz`,
          instructions: `Complete this quiz to test your understanding of ${lesson.title}.`,
          timeLimit: 15,
          passingScore: 0.7,
          maxAttempts: 3,
          isActive: true
        }
      });
    }
    assessments.push(assessment);
  }
  console.log('✅ Created assessments');

  // Create questions for assessments
  for (const assessment of assessments) {
    const questions = [
      {
        type: QuestionType.multiple_choice,
        content: `What is the main topic covered in this lesson?`,
        points: 1.0,
        correctAnswer: 'A',
        explanation: 'This lesson covers the fundamental concepts as described.',
        order: 1
      },
      {
        type: QuestionType.true_false,
        content: `This concept is important for understanding advanced topics.`,
        points: 1.0,
        correctAnswer: 'True',
        explanation: 'Understanding this concept is crucial for building more complex knowledge.',
        order: 2
      }
    ];

    for (const questionData of questions) {
      // Check if question already exists
      const existingQuestion = await prisma.question.findFirst({
        where: {
          assessmentId: assessment.id,
          content: questionData.content
        }
      });

      let question;
      if (existingQuestion) {
        question = existingQuestion;
      } else {
        question = await prisma.question.create({
          data: {
            ...questionData,
            assessmentId: assessment.id,
            isActive: true
          }
        });
      }

      // Create question options for multiple choice
      if (questionData.type === QuestionType.multiple_choice) {
        const options = [
          { content: 'The main concept', isCorrect: true, order: 1 },
          { content: 'A side topic', isCorrect: false, order: 2 },
          { content: 'An unrelated topic', isCorrect: false, order: 3 },
          { content: 'A difficult concept', isCorrect: false, order: 4 }
        ];

        for (const optionData of options) {
          // Check if option already exists
          const existingOption = await prisma.questionOption.findFirst({
            where: {
              questionId: question.id,
              content: optionData.content
            }
          });

          if (!existingOption) {
            await prisma.questionOption.create({
              data: {
                ...optionData,
                questionId: question.id
              }
            });
          }
        }
      }
    }
  }
  console.log('✅ Created questions and options');

  // Create assessment attempts
  for (const student of students) {
    for (const assessment of assessments) {
      const attempts = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < attempts; i++) {
        const score = Math.random() * 0.4 + 0.6; // 60-100%
        const attempt = await prisma.assessmentAttempt.create({
          data: {
            studentId: student.id,
            assessmentId: assessment.id,
            startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
            completedAt: new Date(),
            score: score,
            feedback: score > 0.8 ? 'Excellent work!' : score > 0.6 ? 'Good job!' : 'Keep practicing!',
            passed: score >= 0.7
          }
        });

        // Create student responses
        const questions = await prisma.question.findMany({
          where: { assessmentId: assessment.id }
        });

        for (const question of questions) {
          await prisma.studentResponse.create({
            data: {
              attemptId: attempt.id,
              questionId: question.id,
              answer: question.type === QuestionType.multiple_choice ? 'A' : 'True',
              isCorrect: Math.random() > 0.3, // 70% correct
              pointsEarned: Math.random() > 0.3 ? question.points : 0,
              feedback: Math.random() > 0.3 ? 'Correct!' : 'Incorrect, review the material.',
              timeSpent: Math.floor(Math.random() * 60) + 10
            }
          });
        }
      }
    }
  }
  console.log('✅ Created assessment attempts and responses');

  // Create learning analytics
  for (const student of students) {
    for (let i = 0; i < 4; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7); // Last 4 weeks
      
      await prisma.learningAnalytics.upsert({
        where: {
          studentId_dateRange: {
            studentId: student.id,
            dateRange: date
          }
        },
        update: {},
        create: {
          studentId: student.id,
          dateRange: date,
          conceptsMastered: Math.floor(Math.random() * 5) + 1,
          timeSpent: Math.floor(Math.random() * 120) + 30,
          assessmentScores: [Math.random() * 0.4 + 0.6, Math.random() * 0.4 + 0.6],
          strugglingTopics: ['Advanced Algebra'],
          improvingTopics: ['Basic Geometry']
        }
      });
    }
  }
  console.log('✅ Created learning analytics');

  // Create personalization data
  for (const student of students) {
    await prisma.personalizationData.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        effectiveStrategies: {
          visualLearning: 0.8,
          stepByStep: 0.9,
          practiceProblems: 0.7
        },
        ineffectiveStrategies: {
          lectureOnly: 0.3,
          complexExamples: 0.4
        },
        optimalDifficulty: {
          mathematics: 0.6,
          physics: 0.5,
          history: 0.7
        },
        contentPreferences: {
          videos: 0.8,
          interactive: 0.9,
          text: 0.5
        },
        studyPatterns: {
          optimalTime: 'morning',
          sessionLength: 45,
          breakFrequency: 15
        }
      }
    });
  }
  console.log('✅ Created personalization data');

  // Create success metrics
  for (const student of students) {
    for (const subject of subjects) {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Check if success metrics already exist
      const existingMetrics = await prisma.successMetrics.findFirst({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          period: PerformancePeriod.weekly,
          startDate: startDate
        }
      });

      if (!existingMetrics) {
        await prisma.successMetrics.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            period: PerformancePeriod.weekly,
            startDate: startDate,
            endDate: new Date(),
            totalLessons: 5,
            completedLessons: Math.floor(Math.random() * 5) + 1,
            completionRate: Math.random() * 0.4 + 0.6,
            totalAssessments: 3,
            passedAssessments: Math.floor(Math.random() * 3) + 1,
            masteryRate: Math.random() * 0.4 + 0.6,
            timeSpent: Math.floor(Math.random() * 180) + 60,
            engagementScore: Math.random() * 0.4 + 0.6,
            retentionRate: Math.random() * 0.4 + 0.6
          }
        });
      }
    }
  }
  console.log('✅ Created success metrics');

  // Create attendance records
  const teachers = createdUsers.filter(u => u.role === Role.teacher);
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    for (const student of students) {
      // Check if attendance already exists
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          studentId: student.id,
          date: date
        }
      });

      if (!existingAttendance) {
        const statuses = [AttendanceStatus.present, AttendanceStatus.present, AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.absent];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        await prisma.attendance.create({
          data: {
            organizationId: defaultOrg.id,
            studentId: student.id,
            date: date,
            status: randomStatus,
            checkInTime: randomStatus === AttendanceStatus.present ? new Date(date.getTime() + 8 * 60 * 60 * 1000) : null,
            checkOutTime: randomStatus === AttendanceStatus.present ? new Date(date.getTime() + 15 * 60 * 60 * 1000) : null,
            recordedBy: teachers[0].id
          }
        });
      }
    }
  }
  console.log('✅ Created attendance records');

  // Create grade categories
  const gradeCategories = [
    { name: 'Homework', description: 'Daily homework assignments', weight: 0.2, color: '#3b82f6' },
    { name: 'Quizzes', description: 'Weekly quizzes', weight: 0.3, color: '#10b981' },
    { name: 'Tests', description: 'Major tests', weight: 0.4, color: '#f59e0b' },
    { name: 'Projects', description: 'Long-term projects', weight: 0.1, color: '#8b5cf6' }
  ];

  const createdGradeCategories = [];
  for (const categoryData of gradeCategories) {
    const category = await prisma.gradeCategory.upsert({
      where: {
        organizationId_name: {
          organizationId: defaultOrg.id,
          name: categoryData.name
        }
      },
      update: {},
      create: {
        ...categoryData,
        organizationId: defaultOrg.id
      }
    });
    createdGradeCategories.push(category);
  }
  console.log('✅ Created grade categories');

  // Create assignments
  for (const category of createdGradeCategories) {
    for (let i = 1; i <= 3; i++) {
      // Check if assignment already exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          categoryId: category.id,
          title: `${category.name} ${i}`
        }
      });

      if (!existingAssignment) {
        await prisma.assignment.create({
          data: {
            organizationId: defaultOrg.id,
            categoryId: category.id,
            title: `${category.name} ${i}`,
            description: `This is ${category.name.toLowerCase()} assignment ${i}`,
            dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
            totalPoints: 100.0,
            createdBy: teachers[0].id
          }
        });
      }
    }
  }
  console.log('✅ Created assignments');

  // Create grades
  const assignments = await prisma.assignment.findMany();
  for (const student of students) {
    for (const assignment of assignments) {
      // Check if grade already exists
      const existingGrade = await prisma.grade.findFirst({
        where: {
          studentId: student.id,
          assignmentId: assignment.id
        }
      });

      if (!existingGrade) {
        const score = Math.random() * 40 + 60; // 60-100
        await prisma.grade.create({
          data: {
            organizationId: defaultOrg.id,
            studentId: student.id,
            assignmentId: assignment.id,
            score: score,
            maxScore: assignment.totalPoints,
            percentage: (score / assignment.totalPoints) * 100,
            letterGrade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
            feedback: score >= 90 ? 'Excellent work!' : score >= 80 ? 'Good job!' : score >= 70 ? 'Satisfactory' : 'Needs improvement',
            gradedBy: teachers[0].id
          }
        });
      }
    }
  }
  console.log('✅ Created grades');

  // Create student performance summaries
  for (const student of students) {
    await prisma.studentPerformance.create({
      data: {
        organizationId: defaultOrg.id,
        studentId: student.id,
        period: PerformancePeriod.monthly,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        totalDays: 20,
        presentDays: 18,
        absentDays: 1,
        lateDays: 1,
        attendanceRate: 90.0,
        totalAssignments: 12,
        completedAssignments: 11,
        averageGrade: Math.random() * 20 + 80,
        highestGrade: Math.random() * 10 + 90,
        lowestGrade: Math.random() * 20 + 70,
        gpa: Math.random() * 1.5 + 3.0,
        rank: Math.floor(Math.random() * 20) + 1
      }
    });
  }
  console.log('✅ Created student performance summaries');

  // Create chat rooms
  const generalRoom = await prisma.chatRoom.upsert({
    where: {
      organizationId_name: {
        organizationId: defaultOrg.id,
        name: 'General'
      }
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'General',
      description: 'General discussion room for all members'
    }
  });

  const studyRoom = await prisma.chatRoom.upsert({
    where: {
      organizationId_name: {
        organizationId: defaultOrg.id,
        name: 'Study Group'
      }
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      name: 'Study Group',
      description: 'Study group discussions and homework help'
    }
  });
  console.log('✅ Created chat rooms');

  // Create chat participants
  for (const user of createdUsers) {
    await prisma.chatParticipant.upsert({
      where: {
        roomId_userId: {
          roomId: generalRoom.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        roomId: generalRoom.id,
        userId: user.id
      }
    });

    if (user.role === Role.student) {
      await prisma.chatParticipant.upsert({
        where: {
          roomId_userId: {
            roomId: studyRoom.id,
            userId: user.id
          }
        },
        update: {},
        create: {
          roomId: studyRoom.id,
          userId: user.id
        }
      });
    }
  }
  console.log('✅ Created chat participants');

  // Create chat messages
  const welcomeMessage = await prisma.chatMessage.create({
    data: {
      roomId: generalRoom.id,
      senderId: createdUsers.find(u => u.role === Role.admin)?.id || createdUsers[0].id,
      content: `Welcome to ${defaultOrg.name}! This is the general chat room where you can discuss topics with your classmates and teachers.`,
      messageType: MessageType.system
    }
  });

  const studyMessage = await prisma.chatMessage.create({
    data: {
      roomId: studyRoom.id,
      senderId: students[0].id,
      content: 'Hey everyone! I need help with the algebra homework. Can anyone explain linear equations?',
      messageType: MessageType.text
    }
  });
  console.log('✅ Created chat messages');

  // Create neural pathways for adaptive teaching
  for (const student of students) {
    const pathwayTypes = [PathwayType.sequential, PathwayType.parallel, PathwayType.network];
    
    for (const pathwayType of pathwayTypes) {
      await prisma.neuralPathway.upsert({
        where: {
          studentId_pathwayType: {
            studentId: student.id,
            pathwayType: pathwayType
          }
        },
        update: {},
        create: {
          studentId: student.id,
          pathwayType: pathwayType,
          strength: Math.random() * 0.4 + 0.6,
          activationPattern: {
            steps: ['input', 'process', 'output'],
            sequence: [1, 2, 3]
          },
          learningVelocity: Math.random() * 0.4 + 0.6,
          retentionRate: Math.random() * 0.4 + 0.6,
          emotionalResonance: Math.random() * 0.4 + 0.6,
          crossDomainTransfer: Math.random() * 0.4 + 0.6
        }
      });
    }
  }
  console.log('✅ Created neural pathways');

  // Create learning dimensions
  for (const student of students) {
    await prisma.learningDimensions.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        cognitive: {
          processingSpeed: Math.random() * 0.4 + 0.6,
          workingMemory: Math.random() * 0.4 + 0.6,
          attentionSpan: Math.random() * 0.4 + 0.6,
          patternRecognition: Math.random() * 0.4 + 0.6
        },
        emotional: {
          motivation: Math.random() * 0.4 + 0.6,
          confidence: Math.random() * 0.4 + 0.6,
          frustration: Math.random() * 0.3 + 0.1,
          curiosity: Math.random() * 0.4 + 0.6
        },
        social: {
          collaboration: Math.random() * 0.4 + 0.6,
          competition: Math.random() * 0.4 + 0.6,
          mentorship: Math.random() * 0.4 + 0.6,
          independence: Math.random() * 0.4 + 0.6
        },
        creative: {
          imagination: Math.random() * 0.4 + 0.6,
          innovation: Math.random() * 0.4 + 0.6,
          artistic: Math.random() * 0.4 + 0.6,
          analytical: Math.random() * 0.4 + 0.6
        }
      }
    });
  }
  console.log('✅ Created learning dimensions');

  // Create learning interventions
  for (const student of students) {
    const interventionTypes = [InterventionType.predictive, InterventionType.remedial, InterventionType.creative];
    
    for (const interventionType of interventionTypes) {
      await prisma.learningIntervention.create({
        data: {
          studentId: student.id,
          interventionType: interventionType,
          trigger: `Student needs ${interventionType} support`,
          approach: `Use ${interventionType} teaching methods`,
          expectedOutcome: 'Improved learning outcomes',
          confidence: Math.random() * 0.4 + 0.6,
          personalizedContent: `This is personalized content for ${interventionType} intervention.`,
          crossDomainConnections: ['Mathematics', 'Physics'],
          emotionalSupport: 'You are doing great! Keep up the excellent work!',
          successMetrics: ['Improved test scores', 'Increased engagement', 'Better retention'],
          isActive: true
        }
      });
    }
  }
  console.log('✅ Created learning interventions');

  // Create cross-domain connections
  for (const student of students) {
    const connections = [
      { source: 'Mathematics', target: 'Physics', type: 'application' },
      { source: 'Physics', target: 'Mathematics', type: 'analogy' },
      { source: 'History', target: 'Mathematics', type: 'creative' }
    ];

    for (const connection of connections) {
      await prisma.crossDomainConnection.upsert({
        where: {
          studentId_sourceDomain_targetDomain_connectionType: {
            studentId: student.id,
            sourceDomain: connection.source,
            targetDomain: connection.target,
            connectionType: connection.type
          }
        },
        update: {},
        create: {
          studentId: student.id,
          sourceDomain: connection.source,
          targetDomain: connection.target,
          connectionType: connection.type,
          strength: Math.random() * 0.4 + 0.6,
          usageCount: Math.floor(Math.random() * 10) + 1,
          effectiveness: Math.random() * 0.4 + 0.6
        }
      });
    }
  }
  console.log('✅ Created cross-domain connections');

  // Create emotional states
  for (const student of students) {
    for (let i = 0; i < 10; i++) {
      await prisma.emotionalState.create({
        data: {
          studentId: student.id,
          sessionId: `session_${i}`,
          confidence: Math.random() * 0.4 + 0.6,
          stress: Math.random() * 0.3 + 0.1,
          engagement: Math.random() * 0.4 + 0.6,
          motivation: Math.random() * 0.4 + 0.6,
          curiosity: Math.random() * 0.4 + 0.6,
          frustration: Math.random() * 0.2 + 0.1,
          joy: Math.random() * 0.4 + 0.6,
          context: `Learning session ${i + 1}`,
          detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }
  console.log('✅ Created emotional states');

  // Create predictive analytics
  for (const student of students) {
    const predictionTypes = ['success', 'engagement', 'retention', 'struggle'];
    
    for (const predictionType of predictionTypes) {
      await prisma.predictiveAnalytics.create({
        data: {
          studentId: student.id,
          predictionType: predictionType,
          confidence: Math.random() * 0.4 + 0.6,
          predictedValue: Math.random() * 0.4 + 0.6,
          actualValue: Math.random() * 0.4 + 0.6,
          accuracy: Math.random() * 0.4 + 0.6,
          factors: {
            previousPerformance: Math.random() * 0.4 + 0.6,
            engagement: Math.random() * 0.4 + 0.6,
            timeSpent: Math.random() * 0.4 + 0.6
          },
          interventionSuggested: Math.random() > 0.5,
          predictedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }
  console.log('✅ Created predictive analytics');

  // Create failure analyses
  for (const student of students) {
    for (const assessment of assessments) {
      if (Math.random() > 0.7) { // 30% chance of failure
        await prisma.failureAnalysis.create({
          data: {
            studentId: student.id,
            assessmentId: assessment.id,
            failureType: FailureType.concept_gap,
            diagnosis: 'Student has gaps in fundamental concepts',
            remediation: 'Provide additional practice with basic concepts',
            resolved: Math.random() > 0.5
          }
        });
      }
    }
  }
  console.log('✅ Created failure analyses');

  // Create progress reports
  for (const student of students) {
    for (let i = 0; i < 4; i++) {
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - i * 7);
      
      await prisma.progressReport.create({
        data: {
          userId: student.id,
          reportDate: reportDate,
          sessionsCount: Math.floor(Math.random() * 10) + 5,
          questionsAsked: Math.floor(Math.random() * 20) + 10,
          topicsCovered: ['Algebra', 'Geometry', 'Physics'],
          timeSpent: Math.floor(Math.random() * 300) + 120
        }
      });
    }
  }
  console.log('✅ Created progress reports');

  // Create scheduled reports
  await prisma.scheduledReport.create({
    data: {
      organizationId: defaultOrg.id,
      name: 'Weekly Progress Summary',
      description: 'Weekly summary of student progress and activities',
      frequency: ReportFrequency.weekly,
      dayOfWeek: 1, // Monday
      time: '09:00',
      recipients: ['admin@example.com', 'teacher@example.com'],
      metrics: ['sessionsCount', 'questionsAsked', 'timeSpent', 'topicsCovered'],
      format: ReportFormat.html,
      createdBy: createdUsers.find(u => u.role === Role.admin)?.id || createdUsers[0].id
    }
  });
  console.log('✅ Created scheduled reports');

  // Create audit logs
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        organizationId: defaultOrg.id,
        userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
        action: 'user_login',
        resource: 'user',
        resourceId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
        details: {
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }
  console.log('✅ Created audit logs');

  // Create email logs
  for (const student of students) {
    const guardians = createdUsers.filter(u => u.role === Role.guardian);
    for (const guardian of guardians) {
      await prisma.emailLog.create({
        data: {
          recipientId: guardian.id,
          subject: `Weekly Progress Report for ${student.name}`,
          content: `Here's the weekly progress report for ${student.name}.`,
          status: EmailStatus.delivered,
          sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }
  console.log('✅ Created email logs');

  console.log('🎉 Comprehensive database seeding completed successfully!');
  console.log(`Created ${createdUsers.length} users, ${subjects.length} subjects, ${createdLessons.length} lessons, and much more!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
