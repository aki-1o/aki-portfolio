// Add a new project by pushing another object onto this array.
// `featured: true` makes it the one card shown on the homepage —
// keep exactly one project featured at a time.
export const projects = [
  {
    title: 'Task Management Application',
    year: '2026',
    description:
      'CLI and Web-based task manager featuring custom workflow status tracking and persistent session logging.',
    tags: ['PHP', 'Laravel', 'MySQL'],
    image: null,
    link: 'https://github.com/aki-1o',
    team: ['Akshat Thoriya'],
    screenshots: [],
    featured: true,
  },
  {
    title: 'Interactive Web Quiz Platform',
    year: '2026',
    description:
      'Real-time web-based quiz game supporting concurrent user sessions and instant score leaderboards.',
    tags: ['React', 'Django', 'Python', 'REST API'],
    image: null,
    link: 'https://github.com/aki-1o',
    team: ['Akshat Thoriya', 'University Project Group'],
    screenshots: [],
    featured: false,
  },
  {
    title: 'Form Processing & Cookie Manager',
    year: '2026',
    description:
      'Full-stack express application demonstrating secure client cookie handling and dynamic form routing.',
    tags: ['Express', 'React', 'Node.js'],
    image: null,
    link: 'https://github.com/aki-1o',
    team: ['Akshat Thoriya'],
    screenshots: [],
    featured: false,
  },
]
