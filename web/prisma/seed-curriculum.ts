import { PrismaClient, DifficultyLevel, SubjectLevel, OrganizationTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding curriculum data...');

  // Create a test organization if it doesn't exist
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo School',
      slug: 'demo-school',
      description: 'A demonstration school for testing the AI Teacher system',
      tier: OrganizationTier.premium,
      isActive: true
    }
  });

  // Create Mathematics subject
  const mathSubject = await prisma.subject.upsert({
    where: { 
      organizationId_name: {
        organizationId: organization.id,
        name: 'Mathematics'
      }
    },
    update: {},
    create: {
      name: 'Mathematics',
      description: 'A comprehensive course covering fundamental mathematical concepts and problem-solving skills',
      level: SubjectLevel.high,
      organizationId: organization.id,
      isActive: true
    }
  });

  // Create Algebra topic
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

  // Create lessons for Algebra
  const algebraLessons = [
    {
      title: 'Introduction to Variables',
      content: `Variables are symbols that represent unknown values in mathematics. They are typically represented by letters like x, y, or z.

In algebra, we use variables to:
- Represent unknown quantities
- Create general formulas
- Solve problems with multiple unknowns

For example, if we say "x + 5 = 10", the variable x represents an unknown number that, when added to 5, equals 10.

Key concepts:
1. Variables can represent any number
2. Variables help us write general rules
3. We can solve for variables using various methods

Practice: If x + 3 = 8, what is the value of x?`,
      objectives: [
        'Understand what variables represent',
        'Identify variables in mathematical expressions',
        'Solve simple equations with variables'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 30,
      order: 1
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
4. Divide both sides by the coefficient of the variable

Example: Solve 2x + 3 = 11
Step 1: Subtract 3 from both sides
2x + 3 - 3 = 11 - 3
2x = 8

Step 2: Divide both sides by 2
2x ÷ 2 = 8 ÷ 2
x = 4

Therefore, x = 4 is the solution.`,
      objectives: [
        'Identify linear equations',
        'Solve linear equations step by step',
        'Apply the rules of equation solving'
      ],
      difficulty: DifficultyLevel.intermediate,
      estimatedTime: 45,
      order: 2
    },
    {
      title: 'Systems of Equations',
      content: `A system of equations is a set of two or more equations with the same variables. We solve systems to find values that satisfy all equations simultaneously.

Methods for solving systems:
1. Substitution Method
2. Elimination Method
3. Graphing Method

Example using substitution:
Solve the system:
x + y = 5
2x - y = 1

Step 1: Solve the first equation for y
y = 5 - x

Step 2: Substitute this expression into the second equation
2x - (5 - x) = 1
2x - 5 + x = 1
3x - 5 = 1
3x = 6
x = 2

Step 3: Substitute x = 2 back into the first equation
2 + y = 5
y = 3

The solution is x = 2, y = 3.`,
      objectives: [
        'Understand what a system of equations is',
        'Solve systems using substitution',
        'Verify solutions by checking both equations'
      ],
      difficulty: DifficultyLevel.advanced,
      estimatedTime: 60,
      order: 3
    }
  ];

  for (const lessonData of algebraLessons) {
    await prisma.lesson.upsert({
      where: {
        topicId_title: {
          topicId: algebraTopic.id,
          title: lessonData.title
        }
      },
      update: {},
      create: {
        ...lessonData,
        topicId: algebraTopic.id,
        isActive: true
      }
    });
  }

  // Create Geometry topic
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

  // Create lessons for Geometry
  const geometryLessons = [
    {
      title: 'Basic Geometric Shapes',
      content: `Geometry is the branch of mathematics that deals with shapes, sizes, and properties of figures.

Basic geometric shapes include:
1. Triangle - 3 sides
2. Square - 4 equal sides, 4 right angles
3. Rectangle - 4 sides, 4 right angles
4. Circle - all points equidistant from center
5. Pentagon - 5 sides
6. Hexagon - 6 sides

Properties to remember:
- Triangles have 3 angles that sum to 180°
- Squares have 4 equal sides and 4 right angles
- Circles have no sides but have circumference and area
- Regular polygons have all sides and angles equal`,
      objectives: [
        'Identify basic geometric shapes',
        'Understand properties of different shapes',
        'Recognize regular and irregular polygons'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 25,
      order: 1
    },
    {
      title: 'Area and Perimeter',
      content: `Area and perimeter are fundamental concepts in geometry.

Perimeter is the distance around a shape.
Area is the amount of space inside a shape.

Formulas:
- Square: Perimeter = 4 × side, Area = side²
- Rectangle: Perimeter = 2(length + width), Area = length × width
- Triangle: Perimeter = sum of all sides, Area = ½ × base × height
- Circle: Circumference = 2πr, Area = πr²

Example: Find the area and perimeter of a rectangle with length 6 and width 4.
Perimeter = 2(6 + 4) = 2(10) = 20 units
Area = 6 × 4 = 24 square units`,
      objectives: [
        'Calculate perimeter of basic shapes',
        'Calculate area of basic shapes',
        'Apply formulas correctly'
      ],
      difficulty: DifficultyLevel.intermediate,
      estimatedTime: 40,
      order: 2
    }
  ];

  for (const lessonData of geometryLessons) {
    await prisma.lesson.upsert({
      where: {
        topicId_title: {
          topicId: geometryTopic.id,
          title: lessonData.title
        }
      },
      update: {},
      create: {
        ...lessonData,
        topicId: geometryTopic.id,
        isActive: true
      }
    });
  }

  // Create Physics subject
  const physicsSubject = await prisma.subject.upsert({
    where: { 
      organizationId_name: {
        organizationId: organization.id,
        name: 'Physics'
      }
    },
    update: {},
    create: {
      name: 'Physics',
      description: 'Study of matter, energy, and their interactions in the universe',
      level: SubjectLevel.high,
      organizationId: organization.id,
      isActive: true
    }
  });

  // Create Mechanics topic
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

  // Create lessons for Mechanics
  const mechanicsLessons = [
    {
      title: 'Introduction to Motion',
      content: `Motion is the change in position of an object over time.

Key concepts:
1. Distance - total path length traveled
2. Displacement - change in position (vector quantity)
3. Speed - distance traveled per unit time
4. Velocity - displacement per unit time (vector quantity)
5. Acceleration - rate of change of velocity

Types of motion:
- Uniform motion: constant speed
- Accelerated motion: changing speed
- Circular motion: motion in a circle
- Projectile motion: motion under gravity

Example: A car travels 100 km in 2 hours. What is its average speed?
Speed = Distance ÷ Time = 100 km ÷ 2 hours = 50 km/h`,
      objectives: [
        'Understand basic motion concepts',
        'Distinguish between distance and displacement',
        'Calculate average speed'
      ],
      difficulty: DifficultyLevel.beginner,
      estimatedTime: 35,
      order: 1
    }
  ];

  for (const lessonData of mechanicsLessons) {
    await prisma.lesson.upsert({
      where: {
        topicId_title: {
          topicId: mechanicsTopic.id,
          title: lessonData.title
        }
      },
      update: {},
      create: {
        ...lessonData,
        topicId: mechanicsTopic.id,
        isActive: true
      }
    });
  }

  console.log('✅ Curriculum seeding completed!');
  console.log(`Created ${mathSubject.name} with ${algebraTopic.name} and ${geometryTopic.name} topics`);
  console.log(`Created ${physicsSubject.name} with ${mechanicsTopic.name} topic`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding curriculum:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
