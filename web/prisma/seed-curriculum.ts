import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Curriculum seeding disabled - will be enabled in Phase 12');
  return;
  
  /*
  // TODO: Enable curriculum seeding in Phase 12
  console.log('🌱 Seeding curriculum data...');

  // Get the first organization (or create one if none exists)
  let organization: any = await prisma.organization.findFirst();
  
  if (!organization) {
    console.log('No organization found, creating one...');
    organization = await prisma.organization.create({
      data: {
        name: 'Demo Academy',
        slug: 'demo-academy',
        description: 'A demonstration organization for testing the AI Teacher system',
        tier: 'premium',
        domain: 'demo.example.com'
      }
    });
  }

  // Create Mathematics Subject
  const mathematics = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      code: 'MATH',
      description: 'Fundamental mathematical concepts and problem-solving skills',
      difficulty: 'beginner',
      estimatedHours: 60,
      prerequisites: [],
      organizationId: organization.id
    }
  });

  // Create Algebra Topic
  const algebra = await prisma.topic.create({
    data: {
      name: 'Algebra Fundamentals',
      code: 'ALG101',
      description: 'Introduction to algebraic concepts and operations',
      order: 1,
      difficulty: 'beginner',
      estimatedHours: 20,
      prerequisites: [],
      subjectId: mathematics.id
    }
  });

  // Create Calculus Topic
  const calculus = await prisma.topic.create({
    data: {
      name: 'Calculus I',
      code: 'CALC201',
      description: 'Introduction to differential and integral calculus',
      order: 2,
      difficulty: 'intermediate',
      estimatedHours: 30,
      prerequisites: ['ALG101'],
      subjectId: mathematics.id
    }
  });

  // Create Algebra Lessons
  const variablesLesson = await prisma.lesson.create({
    data: {
      title: 'Introduction to Variables',
      code: 'VAR001',
      description: 'Understanding what variables are and how to use them in mathematical expressions',
      content: `Variables are symbols (usually letters) that represent unknown or changing values in mathematical expressions and equations.

Key Concepts:
1. Variables can represent any number
2. Variables are used to write general mathematical statements
3. Variables help us solve problems with unknown values

Examples:
- x + 5 = 10 (x is a variable representing an unknown number)
- 2y - 3 = 7 (y is a variable)
- Area = length × width (A = l × w, where A, l, and w are variables)

Practice: If x = 3, what is the value of 2x + 1?
Solution: 2(3) + 1 = 6 + 1 = 7`,
      order: 1,
      difficulty: 'beginner',
      estimatedMinutes: 30,
      learningObjectives: [
        'Define what a variable is',
        'Identify variables in mathematical expressions',
        'Substitute values for variables',
        'Solve simple equations with variables'
      ],
      prerequisites: [],
      teachingMethods: ['text', 'examples', 'practice'],
      topicId: algebra.id
    }
  });

  const equationsLesson = await prisma.lesson.create({
    data: {
      title: 'Solving Linear Equations',
      code: 'EQ001',
      description: 'Learn how to solve equations with one variable',
      content: `Linear equations are equations where the variable is raised only to the first power.

Steps to solve linear equations:
1. Simplify both sides of the equation
2. Get all variable terms on one side
3. Get all constant terms on the other side
4. Divide both sides by the coefficient of the variable

Example: Solve 3x + 5 = 14
Step 1: 3x + 5 = 14
Step 2: 3x = 14 - 5 (subtract 5 from both sides)
Step 3: 3x = 9
Step 4: x = 9 ÷ 3 (divide both sides by 3)
Step 5: x = 3

Practice: Solve 2x - 7 = 11
Solution: x = 9`,
      order: 2,
      difficulty: 'beginner',
      estimatedMinutes: 45,
      learningObjectives: [
        'Identify linear equations',
        'Apply the steps to solve linear equations',
        'Check solutions by substitution',
        'Solve word problems using linear equations'
      ],
      prerequisites: ['VAR001'],
      teachingMethods: ['text', 'step_by_step', 'examples', 'practice'],
      topicId: algebra.id
    }
  });

  // Create Calculus Lessons
  const limitsLesson = await prisma.lesson.create({
    data: {
      title: 'Introduction to Limits',
      code: 'LIM001',
      description: 'Understanding the concept of limits in calculus',
      content: `A limit describes the value that a function approaches as the input approaches some value.

Key Concepts:
1. Limits describe behavior as we get close to a point
2. Limits can exist even if the function is not defined at that point
3. Limits help us understand continuity and differentiability

Notation: lim(x→a) f(x) = L means "the limit of f(x) as x approaches a is L"

Examples:
- lim(x→2) x² = 4
- lim(x→0) sin(x)/x = 1 (important limit in calculus)

Practice: What is lim(x→3) (x² - 9)/(x - 3)?
Hint: Factor the numerator first.`,
      order: 1,
      difficulty: 'intermediate',
      estimatedMinutes: 60,
      learningObjectives: [
        'Understand the intuitive meaning of limits',
        'Calculate limits using direct substitution',
        'Handle indeterminate forms',
        'Apply limit laws'
      ],
      prerequisites: ['EQ001'],
      teachingMethods: ['text', 'visual', 'examples', 'practice'],
      topicId: calculus.id
    }
  });

  // Create Science Subject
  const science = await prisma.subject.create({
    data: {
      name: 'Science',
      code: 'SCI',
      description: 'Exploring the natural world through observation and experimentation',
      difficulty: 'beginner',
      estimatedHours: 50,
      prerequisites: [],
      organizationId: organization.id
    }
  });

  // Create Physics Topic
  const physics = await prisma.topic.create({
    data: {
      name: 'Physics Fundamentals',
      code: 'PHY101',
      description: 'Basic principles of physics and motion',
      order: 1,
      difficulty: 'beginner',
      estimatedHours: 25,
      prerequisites: [],
      subjectId: science.id
    }
  });

  // Create Physics Lesson
  const motionLesson = await prisma.lesson.create({
    data: {
      title: 'Motion and Forces',
      code: 'MOT001',
      description: 'Understanding how objects move and the forces that affect them',
      content: `Motion is the change in position of an object over time. Forces are pushes or pulls that can cause motion or change in motion.

Newton's Laws of Motion:
1. First Law (Inertia): An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.
2. Second Law: Force equals mass times acceleration (F = ma)
3. Third Law: For every action, there is an equal and opposite reaction.

Examples:
- A car accelerates when you press the gas pedal (force causes acceleration)
- A book stays on a table because gravity pulls it down and the table pushes it up (balanced forces)
- A rocket moves forward because it pushes gas backward (action-reaction)

Practice: If a 2kg object experiences a force of 10N, what is its acceleration?
Solution: a = F/m = 10N/2kg = 5 m/s²`,
      order: 1,
      difficulty: 'beginner',
      estimatedMinutes: 40,
      learningObjectives: [
        'Define motion and forces',
        'Understand Newton\'s three laws',
        'Calculate acceleration using F = ma',
        'Identify action-reaction pairs'
      ],
      prerequisites: [],
      teachingMethods: ['text', 'visual', 'examples', 'practice'],
      topicId: physics.id
    }
  });

  // Create History Subject
  const history = await prisma.subject.create({
    data: {
      name: 'History',
      code: 'HIST',
      description: 'Understanding the past to better understand the present',
      difficulty: 'beginner',
      estimatedHours: 40,
      prerequisites: [],
      organizationId: organization.id
    }
  });

  // Create Ancient History Topic
  const ancientHistory = await prisma.topic.create({
    data: {
      name: 'Ancient Civilizations',
      code: 'ANCIENT101',
      description: 'Exploring the great civilizations of the ancient world',
      order: 1,
      difficulty: 'beginner',
      estimatedHours: 20,
      prerequisites: [],
      subjectId: history.id
    }
  });

  // Create History Lesson
  const egyptLesson = await prisma.lesson.create({
    data: {
      title: 'Ancient Egypt',
      code: 'EGYPT001',
      description: 'The civilization of the Nile Valley and its lasting impact',
      content: `Ancient Egypt was one of the world's first great civilizations, flourishing along the Nile River for over 3,000 years.

Key Features:
1. Geography: Located along the Nile River, which provided water, transportation, and fertile soil
2. Government: Ruled by pharaohs who were considered both kings and gods
3. Religion: Polytheistic religion with gods like Ra, Osiris, and Isis
4. Achievements: Pyramids, hieroglyphic writing, advanced medicine, and mathematics

Timeline:
- Early Dynastic Period (3100-2686 BCE)
- Old Kingdom (2686-2181 BCE) - Age of Pyramids
- Middle Kingdom (2055-1650 BCE)
- New Kingdom (1550-1070 BCE) - Age of Empire

Legacy: Ancient Egypt influenced art, architecture, writing systems, and religious beliefs throughout the Mediterranean world.

Practice: What role did the Nile River play in the development of Egyptian civilization?`,
      order: 1,
      difficulty: 'beginner',
      estimatedMinutes: 35,
      learningObjectives: [
        'Identify key features of Ancient Egyptian civilization',
        'Understand the importance of the Nile River',
        'Recognize major achievements of Ancient Egypt',
        'Explain the role of pharaohs in Egyptian society'
      ],
      prerequisites: [],
      teachingMethods: ['text', 'visual', 'examples'],
      topicId: ancientHistory.id
    }
  });

  // Create some sample assessments
  await prisma.assessment.create({
    data: {
      lessonId: variablesLesson.id,
      title: 'Variables Quiz',
      description: 'Test your understanding of variables and basic algebra',
      type: 'multiple_choice',
      content: JSON.stringify([
        {
          question: 'What is a variable?',
          options: [
            'A fixed number',
            'A symbol that represents an unknown or changing value',
            'A mathematical operation',
            'A type of equation'
          ],
          correctAnswer: 1
        },
        {
          question: 'If x = 5, what is 2x + 3?',
          options: ['8', '10', '13', '15'],
          correctAnswer: 2
        }
      ]),
      maxPoints: 100,
      passingScore: 0.7,
      timeLimit: 15
    }
  });

  await prisma.assessment.create({
    data: {
      lessonId: equationsLesson.id,
      title: 'Linear Equations Test',
      description: 'Solve linear equations and check your understanding',
      type: 'short_answer',
      content: JSON.stringify([
        {
          question: 'Solve for x: 3x + 7 = 22',
          answer: '5',
          points: 25
        },
        {
          question: 'Solve for y: 2y - 5 = 11',
          answer: '8',
          points: 25
        }
      ]),
      maxPoints: 100,
      passingScore: 0.7,
      timeLimit: 20
    }
  });

  console.log('✅ Curriculum data seeded successfully!');
  console.log(`📚 Created ${await prisma.subject.count()} subjects`);
  console.log(`📖 Created ${await prisma.topic.count()} topics`);
  console.log(`📝 Created ${await prisma.lesson.count()} lessons`);
  console.log(`📋 Created ${await prisma.assessment.count()} assessments`);
  */
}

main()
  .catch((e) => {
    console.error('❌ Error seeding curriculum data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
