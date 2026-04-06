/**
 * Skills Taxonomy Graph
 *
 * In-memory skill normalization, adjacency, and matching engine.
 * Inspired by ESCO (European Skills/Competences classification),
 * O*NET (US Occupational Information Network), and LinkedIn Skills Graph.
 * Tuned for Indian fresher/tech hiring context.
 *
 * All lookups are O(1) via pre-built Maps. No external API calls.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'library'
  | 'database'
  | 'devops'
  | 'cloud'
  | 'tool'
  | 'methodology'
  | 'soft-skill'
  | 'domain';

export interface SkillNode {
  /** Canonical lowercase id, e.g. "javascript" */
  id: string;
  /** Human-readable display name, e.g. "JavaScript" */
  name: string;
  /** Alternate names / abbreviations mapped to this skill */
  aliases: string[];
  /** Skill grouping */
  category: SkillCategory;
  /** IDs of related skills (bidirectional not assumed; declared per-node) */
  adjacent: string[];
}

export interface SkillOverlapResult {
  /** Skills present in both resume and JD (canonical IDs) */
  exact: string[];
  /** Resume skills adjacent to JD skills but not exact matches */
  adjacent: string[];
  /** JD skills with no exact or adjacent match in resume */
  missing: string[];
  /** Composite score: (exact*1.0 + adjacent*0.5) / jdSkills.length */
  score: number;
}

export interface MatchResult {
  matched: SkillNode[];
  unmatched: string[];
}

// ---------------------------------------------------------------------------
// Taxonomy Data
// ---------------------------------------------------------------------------

const SKILLS: SkillNode[] = [
  // ── Languages ──────────────────────────────────────────────────────────
  {
    id: 'javascript',
    name: 'JavaScript',
    aliases: ['js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017', 'es2020', 'es2021', 'ecma script', 'java script'],
    category: 'language',
    adjacent: ['typescript', 'nodejs', 'react', 'angular', 'vue', 'html', 'css'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    aliases: ['ts', 'type script'],
    category: 'language',
    adjacent: ['javascript', 'react', 'angular', 'nodejs', 'nextjs'],
  },
  {
    id: 'python',
    name: 'Python',
    aliases: ['py', 'python3', 'python2', 'cpython'],
    category: 'language',
    adjacent: ['django', 'flask', 'fastapi', 'numpy', 'pandas', 'tensorflow', 'pytorch', 'scikit-learn', 'data-science', 'machine-learning'],
  },
  {
    id: 'java',
    name: 'Java',
    aliases: ['jdk', 'jre', 'j2ee', 'j2se', 'java8', 'java11', 'java17', 'openjdk'],
    category: 'language',
    adjacent: ['spring-boot', 'kotlin', 'maven', 'gradle', 'android-development'],
  },
  {
    id: 'cpp',
    name: 'C++',
    aliases: ['c++', 'cplusplus', 'c plus plus', 'cpp14', 'cpp17', 'cpp20'],
    category: 'language',
    adjacent: ['c', 'rust', 'data-structures', 'competitive-programming'],
  },
  {
    id: 'c',
    name: 'C',
    aliases: ['clang', 'ansi c', 'c99', 'c11'],
    category: 'language',
    adjacent: ['cpp', 'linux', 'embedded-systems', 'iot'],
  },
  {
    id: 'go',
    name: 'Go',
    aliases: ['golang', 'go lang'],
    category: 'language',
    adjacent: ['docker', 'kubernetes', 'microservices', 'rest'],
  },
  {
    id: 'rust',
    name: 'Rust',
    aliases: ['rustlang', 'rust lang'],
    category: 'language',
    adjacent: ['cpp', 'go', 'webassembly'],
  },
  {
    id: 'php',
    name: 'PHP',
    aliases: ['php7', 'php8', 'hypertext preprocessor'],
    category: 'language',
    adjacent: ['laravel', 'mysql', 'wordpress'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    aliases: ['rb'],
    category: 'language',
    adjacent: ['rails', 'postgresql'],
  },
  {
    id: 'swift',
    name: 'Swift',
    aliases: ['swiftui', 'swift ui'],
    category: 'language',
    adjacent: ['ios-development', 'mobile-development', 'xcode'],
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    aliases: ['kt'],
    category: 'language',
    adjacent: ['java', 'android-development', 'mobile-development'],
  },
  {
    id: 'r',
    name: 'R',
    aliases: ['rlang', 'r lang', 'r programming', 'cran'],
    category: 'language',
    adjacent: ['data-science', 'machine-learning', 'statistics'],
  },
  {
    id: 'matlab',
    name: 'MATLAB',
    aliases: ['mat lab', 'simulink'],
    category: 'language',
    adjacent: ['data-science', 'signal-processing', 'machine-learning'],
  },
  {
    id: 'sql',
    name: 'SQL',
    aliases: ['structured query language', 'tsql', 't-sql', 'plsql', 'pl/sql'],
    category: 'language',
    adjacent: ['postgresql', 'mysql', 'sqlite', 'database-design'],
  },
  {
    id: 'html',
    name: 'HTML',
    aliases: ['html5', 'hypertext markup language', 'htm'],
    category: 'language',
    adjacent: ['css', 'javascript', 'web-development', 'accessibility'],
  },
  {
    id: 'css',
    name: 'CSS',
    aliases: ['css3', 'cascading style sheets', 'stylesheet'],
    category: 'language',
    adjacent: ['html', 'tailwindcss', 'bootstrap', 'sass', 'web-development'],
  },
  {
    id: 'sass',
    name: 'Sass',
    aliases: ['scss', 'sass css'],
    category: 'language',
    adjacent: ['css', 'tailwindcss', 'bootstrap'],
  },
  {
    id: 'dart',
    name: 'Dart',
    aliases: ['dart lang', 'dartlang'],
    category: 'language',
    adjacent: ['flutter', 'mobile-development'],
  },
  {
    id: 'scala',
    name: 'Scala',
    aliases: ['scala lang'],
    category: 'language',
    adjacent: ['java', 'spark', 'big-data'],
  },
  {
    id: 'shell',
    name: 'Shell Scripting',
    aliases: ['bash scripting', 'sh', 'zsh', 'shell script', 'bash script'],
    category: 'language',
    adjacent: ['bash', 'linux', 'devops-domain'],
  },
  {
    id: 'perl',
    name: 'Perl',
    aliases: ['perl5', 'perl6'],
    category: 'language',
    adjacent: ['linux', 'regex'],
  },
  {
    id: 'lua',
    name: 'Lua',
    aliases: ['luajit'],
    category: 'language',
    adjacent: ['game-development', 'nginx'],
  },
  {
    id: 'elixir',
    name: 'Elixir',
    aliases: ['elixir lang'],
    category: 'language',
    adjacent: ['phoenix', 'erlang'],
  },
  {
    id: 'haskell',
    name: 'Haskell',
    aliases: ['hs'],
    category: 'language',
    adjacent: ['functional-programming'],
  },

  // ── Frameworks ─────────────────────────────────────────────────────────
  {
    id: 'react',
    name: 'React',
    aliases: ['reactjs', 'react.js', 'react js', 'react 18', 'react 19'],
    category: 'framework',
    adjacent: ['javascript', 'typescript', 'nextjs', 'redux', 'zustand', 'material-ui', 'web-development'],
  },
  {
    id: 'angular',
    name: 'Angular',
    aliases: ['angularjs', 'angular.js', 'angular js', 'ng', 'angular 2+'],
    category: 'framework',
    adjacent: ['typescript', 'javascript', 'rxjs', 'web-development'],
  },
  {
    id: 'vue',
    name: 'Vue.js',
    aliases: ['vuejs', 'vue.js', 'vue js', 'vue 3', 'vue2', 'vue3'],
    category: 'framework',
    adjacent: ['javascript', 'nuxt', 'web-development'],
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    aliases: ['next.js', 'next js', 'nextjs', 'next'],
    category: 'framework',
    adjacent: ['react', 'typescript', 'vercel', 'web-development'],
  },
  {
    id: 'nuxt',
    name: 'Nuxt.js',
    aliases: ['nuxt.js', 'nuxt js', 'nuxtjs'],
    category: 'framework',
    adjacent: ['vue', 'javascript', 'web-development'],
  },
  {
    id: 'svelte',
    name: 'Svelte',
    aliases: ['sveltejs', 'svelte.js', 'sveltekit'],
    category: 'framework',
    adjacent: ['javascript', 'web-development'],
  },
  {
    id: 'express',
    name: 'Express.js',
    aliases: ['expressjs', 'express.js', 'express js'],
    category: 'framework',
    adjacent: ['nodejs', 'javascript', 'rest', 'web-development'],
  },
  {
    id: 'django',
    name: 'Django',
    aliases: ['django rest framework', 'drf'],
    category: 'framework',
    adjacent: ['python', 'postgresql', 'rest', 'web-development'],
  },
  {
    id: 'flask',
    name: 'Flask',
    aliases: ['flask python'],
    category: 'framework',
    adjacent: ['python', 'rest', 'web-development'],
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    aliases: ['fast api', 'fastapi python'],
    category: 'framework',
    adjacent: ['python', 'rest', 'web-development'],
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    aliases: ['springboot', 'spring', 'spring framework', 'spring mvc', 'spring boot java'],
    category: 'framework',
    adjacent: ['java', 'microservices', 'rest'],
  },
  {
    id: 'rails',
    name: 'Ruby on Rails',
    aliases: ['ruby on rails', 'ror', 'rails framework'],
    category: 'framework',
    adjacent: ['ruby', 'postgresql', 'web-development'],
  },
  {
    id: 'laravel',
    name: 'Laravel',
    aliases: ['laravel php'],
    category: 'framework',
    adjacent: ['php', 'mysql', 'web-development'],
  },
  {
    id: 'dotnet',
    name: '.NET',
    aliases: ['.net', 'dotnet', 'asp.net', 'aspnet', '.net core', 'dotnet core', 'c#', 'csharp', 'c sharp'],
    category: 'framework',
    adjacent: ['azure', 'microservices', 'web-development'],
  },
  {
    id: 'flutter',
    name: 'Flutter',
    aliases: ['flutter sdk'],
    category: 'framework',
    adjacent: ['dart', 'mobile-development', 'android-development', 'ios-development'],
  },
  {
    id: 'react-native',
    name: 'React Native',
    aliases: ['reactnative', 'react native', 'rn'],
    category: 'framework',
    adjacent: ['react', 'javascript', 'mobile-development', 'android-development', 'ios-development'],
  },
  {
    id: 'electron',
    name: 'Electron',
    aliases: ['electronjs', 'electron.js'],
    category: 'framework',
    adjacent: ['javascript', 'typescript', 'nodejs'],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    aliases: ['phoenix framework', 'phoenix elixir'],
    category: 'framework',
    adjacent: ['elixir'],
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    aliases: ['nest.js', 'nest js'],
    category: 'framework',
    adjacent: ['typescript', 'nodejs', 'express', 'microservices'],
  },

  // ── Libraries ──────────────────────────────────────────────────────────
  {
    id: 'jquery',
    name: 'jQuery',
    aliases: ['j query', 'jquery.js'],
    category: 'library',
    adjacent: ['javascript', 'html', 'css'],
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    aliases: ['bootstrap css', 'bootstrap 5', 'bootstrap 4', 'twitter bootstrap'],
    category: 'library',
    adjacent: ['css', 'html', 'web-development'],
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    aliases: ['tailwind', 'tailwind css', 'tailwindcss'],
    category: 'library',
    adjacent: ['css', 'html', 'web-development'],
  },
  {
    id: 'material-ui',
    name: 'Material UI',
    aliases: ['mui', 'material ui', 'material-ui', 'material design'],
    category: 'library',
    adjacent: ['react', 'css', 'web-development'],
  },
  {
    id: 'redux',
    name: 'Redux',
    aliases: ['redux toolkit', 'rtk', 'react redux'],
    category: 'library',
    adjacent: ['react', 'javascript', 'zustand'],
  },
  {
    id: 'zustand',
    name: 'Zustand',
    aliases: [],
    category: 'library',
    adjacent: ['react', 'redux', 'javascript'],
  },
  {
    id: 'rxjs',
    name: 'RxJS',
    aliases: ['reactive extensions', 'rx js'],
    category: 'library',
    adjacent: ['angular', 'typescript', 'javascript'],
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    aliases: ['tf', 'tensor flow', 'tensorflow 2', 'tf2', 'tensorflow.js', 'tfjs'],
    category: 'library',
    adjacent: ['python', 'machine-learning', 'deep-learning', 'keras'],
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    aliases: ['torch', 'py torch'],
    category: 'library',
    adjacent: ['python', 'machine-learning', 'deep-learning'],
  },
  {
    id: 'keras',
    name: 'Keras',
    aliases: [],
    category: 'library',
    adjacent: ['tensorflow', 'python', 'deep-learning'],
  },
  {
    id: 'numpy',
    name: 'NumPy',
    aliases: ['np', 'num py'],
    category: 'library',
    adjacent: ['python', 'pandas', 'data-science'],
  },
  {
    id: 'pandas',
    name: 'Pandas',
    aliases: ['pd'],
    category: 'library',
    adjacent: ['python', 'numpy', 'data-science'],
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-learn',
    aliases: ['sklearn', 'scikit learn', 'sk-learn'],
    category: 'library',
    adjacent: ['python', 'machine-learning', 'data-science'],
  },
  {
    id: 'matplotlib',
    name: 'Matplotlib',
    aliases: ['plt', 'mpl'],
    category: 'library',
    adjacent: ['python', 'numpy', 'data-science'],
  },
  {
    id: 'opencv',
    name: 'OpenCV',
    aliases: ['cv2', 'open cv', 'opencv python'],
    category: 'library',
    adjacent: ['python', 'computer-vision', 'machine-learning'],
  },
  {
    id: 'three-js',
    name: 'Three.js',
    aliases: ['threejs', 'three.js', 'three js'],
    category: 'library',
    adjacent: ['javascript', 'webgl', 'web-development'],
  },
  {
    id: 'd3',
    name: 'D3.js',
    aliases: ['d3js', 'd3.js', 'd3 js'],
    category: 'library',
    adjacent: ['javascript', 'data-visualization', 'web-development'],
  },
  {
    id: 'socket-io',
    name: 'Socket.IO',
    aliases: ['socketio', 'socket.io', 'socket io', 'websockets', 'websocket'],
    category: 'library',
    adjacent: ['nodejs', 'javascript', 'real-time'],
  },
  {
    id: 'spark',
    name: 'Apache Spark',
    aliases: ['pyspark', 'spark sql', 'apache spark'],
    category: 'library',
    adjacent: ['scala', 'python', 'big-data', 'data-science'],
  },
  {
    id: 'hadoop',
    name: 'Hadoop',
    aliases: ['apache hadoop', 'hdfs', 'mapreduce'],
    category: 'library',
    adjacent: ['big-data', 'spark', 'data-science'],
  },

  // ── Databases ──────────────────────────────────────────────────────────
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    aliases: ['postgres', 'pg', 'psql', 'postgre sql'],
    category: 'database',
    adjacent: ['sql', 'django', 'rails', 'database-design'],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    aliases: ['my sql', 'mariadb', 'maria db'],
    category: 'database',
    adjacent: ['sql', 'php', 'laravel', 'database-design'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    aliases: ['mongo', 'mongo db', 'mongoose'],
    category: 'database',
    adjacent: ['nodejs', 'express', 'nosql'],
  },
  {
    id: 'redis',
    name: 'Redis',
    aliases: ['redis cache', 'redis db'],
    category: 'database',
    adjacent: ['caching', 'nodejs', 'docker'],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    aliases: ['sqlite3', 'sq lite'],
    category: 'database',
    adjacent: ['sql', 'mobile-development', 'python'],
  },
  {
    id: 'firebase',
    name: 'Firebase',
    aliases: ['firebase db', 'firestore', 'firebase realtime', 'fcm'],
    category: 'database',
    adjacent: ['gcp', 'web-development', 'mobile-development', 'nodejs'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    aliases: ['supa base'],
    category: 'database',
    adjacent: ['postgresql', 'firebase', 'web-development'],
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    aliases: ['dynamo db', 'aws dynamodb'],
    category: 'database',
    adjacent: ['aws', 'nosql', 'serverless'],
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    aliases: ['apache cassandra'],
    category: 'database',
    adjacent: ['nosql', 'big-data', 'distributed-systems'],
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    aliases: ['neo 4j', 'graph database', 'cypher'],
    category: 'database',
    adjacent: ['graph-theory', 'nosql', 'data-science'],
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    aliases: ['elastic search', 'elastic', 'elk', 'elk stack'],
    category: 'database',
    adjacent: ['nosql', 'devops-domain', 'logging'],
  },

  // ── DevOps ─────────────────────────────────────────────────────────────
  {
    id: 'docker',
    name: 'Docker',
    aliases: ['docker container', 'dockerfile', 'docker compose', 'docker-compose'],
    category: 'devops',
    adjacent: ['kubernetes', 'devops-domain', 'microservices', 'linux'],
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    aliases: ['k8s', 'kube', 'kubectl'],
    category: 'devops',
    adjacent: ['docker', 'devops-domain', 'cloud-computing', 'microservices'],
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    aliases: ['jenkins ci', 'jenkins cd', 'jenkins pipeline'],
    category: 'devops',
    adjacent: ['ci-cd', 'devops-domain', 'docker'],
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    aliases: ['gh actions', 'github action', 'github ci'],
    category: 'devops',
    adjacent: ['ci-cd', 'git', 'devops-domain'],
  },
  {
    id: 'gitlab-ci',
    name: 'GitLab CI/CD',
    aliases: ['gitlab ci', 'gitlab cd', 'gitlab ci/cd', 'gitlab pipeline'],
    category: 'devops',
    adjacent: ['ci-cd', 'git', 'devops-domain'],
  },
  {
    id: 'terraform',
    name: 'Terraform',
    aliases: ['tf iac', 'hashicorp terraform', 'hcl'],
    category: 'devops',
    adjacent: ['aws', 'gcp', 'azure', 'devops-domain', 'infrastructure-as-code'],
  },
  {
    id: 'ansible',
    name: 'Ansible',
    aliases: ['ansible playbook'],
    category: 'devops',
    adjacent: ['devops-domain', 'linux', 'infrastructure-as-code'],
  },
  {
    id: 'nginx',
    name: 'Nginx',
    aliases: ['nginx server', 'reverse proxy'],
    category: 'devops',
    adjacent: ['linux', 'docker', 'web-development', 'devops-domain'],
  },
  {
    id: 'apache',
    name: 'Apache HTTP Server',
    aliases: ['apache server', 'httpd', 'apache2'],
    category: 'devops',
    adjacent: ['linux', 'web-development', 'devops-domain'],
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    aliases: ['prom'],
    category: 'devops',
    adjacent: ['grafana', 'kubernetes', 'devops-domain', 'monitoring'],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    aliases: [],
    category: 'devops',
    adjacent: ['prometheus', 'devops-domain', 'monitoring'],
  },
  {
    id: 'helm',
    name: 'Helm',
    aliases: ['helm charts', 'helm chart'],
    category: 'devops',
    adjacent: ['kubernetes', 'devops-domain'],
  },
  {
    id: 'maven',
    name: 'Maven',
    aliases: ['apache maven', 'mvn'],
    category: 'devops',
    adjacent: ['java', 'spring-boot', 'gradle'],
  },
  {
    id: 'gradle',
    name: 'Gradle',
    aliases: [],
    category: 'devops',
    adjacent: ['java', 'kotlin', 'android-development', 'maven'],
  },

  // ── Cloud ──────────────────────────────────────────────────────────────
  {
    id: 'aws',
    name: 'AWS',
    aliases: ['amazon web services', 'amazon aws', 'ec2', 's3', 'lambda', 'aws lambda', 'aws s3', 'aws ec2', 'sqs', 'sns', 'cloudfront'],
    category: 'cloud',
    adjacent: ['cloud-computing', 'docker', 'terraform', 'dynamodb', 'serverless'],
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    aliases: ['google cloud', 'gcloud', 'gcp', 'google cloud platform', 'cloud run', 'bigquery', 'big query'],
    category: 'cloud',
    adjacent: ['cloud-computing', 'firebase', 'kubernetes', 'terraform'],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    aliases: ['azure', 'ms azure', 'azure cloud', 'azure devops'],
    category: 'cloud',
    adjacent: ['cloud-computing', 'dotnet', 'terraform', 'kubernetes'],
  },
  {
    id: 'heroku',
    name: 'Heroku',
    aliases: [],
    category: 'cloud',
    adjacent: ['nodejs', 'python', 'web-development', 'cloud-computing'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    aliases: ['zeit', 'vercel platform'],
    category: 'cloud',
    adjacent: ['nextjs', 'react', 'web-development', 'cloud-computing'],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    aliases: [],
    category: 'cloud',
    adjacent: ['web-development', 'jamstack', 'cloud-computing'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    aliases: ['cloudflare workers', 'cf'],
    category: 'cloud',
    adjacent: ['web-development', 'cdn', 'cloud-computing', 'devops-domain'],
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    aliases: ['digital ocean', 'do'],
    category: 'cloud',
    adjacent: ['linux', 'docker', 'cloud-computing'],
  },
  {
    id: 'serverless',
    name: 'Serverless',
    aliases: ['serverless framework', 'faas', 'function as a service'],
    category: 'cloud',
    adjacent: ['aws', 'gcp', 'azure', 'cloud-computing'],
  },

  // ── Tools ──────────────────────────────────────────────────────────────
  {
    id: 'git',
    name: 'Git',
    aliases: ['git scm', 'github', 'gitlab', 'bitbucket', 'version control', 'vcs'],
    category: 'tool',
    adjacent: ['github-actions', 'gitlab-ci', 'ci-cd'],
  },
  {
    id: 'vscode',
    name: 'VS Code',
    aliases: ['visual studio code', 'vs code', 'vsc'],
    category: 'tool',
    adjacent: ['git', 'typescript'],
  },
  {
    id: 'vim',
    name: 'Vim',
    aliases: ['neovim', 'nvim', 'vi'],
    category: 'tool',
    adjacent: ['linux', 'bash'],
  },
  {
    id: 'postman',
    name: 'Postman',
    aliases: ['postman api'],
    category: 'tool',
    adjacent: ['rest', 'graphql', 'api-development'],
  },
  {
    id: 'figma',
    name: 'Figma',
    aliases: ['figma design'],
    category: 'tool',
    adjacent: ['ui-ux', 'web-development'],
  },
  {
    id: 'jira',
    name: 'Jira',
    aliases: ['jira software', 'atlassian jira'],
    category: 'tool',
    adjacent: ['agile', 'scrum', 'project-management'],
  },
  {
    id: 'confluence',
    name: 'Confluence',
    aliases: ['atlassian confluence'],
    category: 'tool',
    adjacent: ['jira', 'documentation'],
  },
  {
    id: 'slack',
    name: 'Slack',
    aliases: [],
    category: 'tool',
    adjacent: ['communication', 'teamwork'],
  },
  {
    id: 'linux',
    name: 'Linux',
    aliases: ['ubuntu', 'debian', 'centos', 'redhat', 'rhel', 'fedora', 'linux administration', 'unix'],
    category: 'tool',
    adjacent: ['bash', 'docker', 'devops-domain', 'shell'],
  },
  {
    id: 'bash',
    name: 'Bash',
    aliases: ['bash shell', 'bourne again shell'],
    category: 'tool',
    adjacent: ['linux', 'shell', 'devops-domain'],
  },
  {
    id: 'webpack',
    name: 'Webpack',
    aliases: ['webpack bundler'],
    category: 'tool',
    adjacent: ['javascript', 'nodejs', 'web-development'],
  },
  {
    id: 'vite',
    name: 'Vite',
    aliases: ['vitejs', 'vite.js'],
    category: 'tool',
    adjacent: ['javascript', 'typescript', 'react', 'vue', 'web-development'],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    aliases: ['node', 'node.js', 'node js', 'nodejs'],
    category: 'tool',
    adjacent: ['javascript', 'typescript', 'express', 'npm'],
  },
  {
    id: 'npm',
    name: 'npm',
    aliases: ['node package manager', 'npmjs'],
    category: 'tool',
    adjacent: ['nodejs', 'javascript', 'yarn'],
  },
  {
    id: 'yarn',
    name: 'Yarn',
    aliases: ['yarnpkg'],
    category: 'tool',
    adjacent: ['nodejs', 'javascript', 'npm'],
  },
  {
    id: 'xcode',
    name: 'Xcode',
    aliases: [],
    category: 'tool',
    adjacent: ['swift', 'ios-development'],
  },
  {
    id: 'android-studio',
    name: 'Android Studio',
    aliases: [],
    category: 'tool',
    adjacent: ['kotlin', 'java', 'android-development'],
  },
  {
    id: 'jupyter',
    name: 'Jupyter Notebook',
    aliases: ['jupyter', 'jupyter notebook', 'jupyter lab', 'jupyterlab', 'ipython'],
    category: 'tool',
    adjacent: ['python', 'data-science', 'machine-learning'],
  },
  {
    id: 'tableau',
    name: 'Tableau',
    aliases: ['tableau desktop', 'tableau server'],
    category: 'tool',
    adjacent: ['data-visualization', 'data-science', 'sql'],
  },
  {
    id: 'power-bi',
    name: 'Power BI',
    aliases: ['powerbi', 'power bi', 'microsoft power bi'],
    category: 'tool',
    adjacent: ['data-visualization', 'data-science', 'sql'],
  },

  // ── Methodologies ──────────────────────────────────────────────────────
  {
    id: 'agile',
    name: 'Agile',
    aliases: ['agile methodology', 'agile development'],
    category: 'methodology',
    adjacent: ['scrum', 'kanban', 'jira'],
  },
  {
    id: 'scrum',
    name: 'Scrum',
    aliases: ['scrum master', 'scrum methodology'],
    category: 'methodology',
    adjacent: ['agile', 'kanban', 'jira'],
  },
  {
    id: 'kanban',
    name: 'Kanban',
    aliases: ['kanban board'],
    category: 'methodology',
    adjacent: ['agile', 'scrum', 'jira'],
  },
  {
    id: 'tdd',
    name: 'Test-Driven Development',
    aliases: ['tdd', 'test driven development', 'test-driven'],
    category: 'methodology',
    adjacent: ['ci-cd', 'unit-testing'],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD',
    aliases: ['cicd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
    category: 'methodology',
    adjacent: ['github-actions', 'gitlab-ci', 'jenkins', 'devops-domain'],
  },
  {
    id: 'devops-domain',
    name: 'DevOps',
    aliases: ['dev ops'],
    category: 'methodology',
    adjacent: ['docker', 'kubernetes', 'ci-cd', 'terraform', 'cloud-computing'],
  },
  {
    id: 'microservices',
    name: 'Microservices',
    aliases: ['micro services', 'microservice architecture', 'msa'],
    category: 'methodology',
    adjacent: ['docker', 'kubernetes', 'rest', 'api-development'],
  },
  {
    id: 'rest',
    name: 'REST',
    aliases: ['restful', 'rest api', 'restful api', 'rest apis'],
    category: 'methodology',
    adjacent: ['graphql', 'express', 'api-development', 'postman'],
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    aliases: ['graph ql', 'gql', 'apollo graphql'],
    category: 'methodology',
    adjacent: ['rest', 'api-development', 'apollo'],
  },
  {
    id: 'design-patterns',
    name: 'Design Patterns',
    aliases: ['software design patterns', 'gof patterns', 'solid', 'solid principles'],
    category: 'methodology',
    adjacent: ['oop', 'software-architecture'],
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    aliases: ['oops', 'oop', 'object oriented', 'object-oriented'],
    category: 'methodology',
    adjacent: ['java', 'cpp', 'design-patterns'],
  },
  {
    id: 'functional-programming',
    name: 'Functional Programming',
    aliases: ['fp', 'functional'],
    category: 'methodology',
    adjacent: ['haskell', 'elixir', 'javascript'],
  },
  {
    id: 'system-design',
    name: 'System Design',
    aliases: ['system architecture', 'high level design', 'hld', 'low level design', 'lld'],
    category: 'methodology',
    adjacent: ['microservices', 'distributed-systems', 'database-design', 'software-architecture'],
  },
  {
    id: 'data-structures',
    name: 'Data Structures & Algorithms',
    aliases: ['dsa', 'data structures', 'algorithms', 'data structures and algorithms'],
    category: 'methodology',
    adjacent: ['competitive-programming', 'problem-solving', 'cpp', 'java'],
  },
  {
    id: 'unit-testing',
    name: 'Unit Testing',
    aliases: ['jest', 'mocha', 'pytest', 'junit', 'testing', 'test automation', 'selenium', 'cypress'],
    category: 'methodology',
    adjacent: ['tdd', 'ci-cd'],
  },
  {
    id: 'infrastructure-as-code',
    name: 'Infrastructure as Code',
    aliases: ['iac', 'infra as code'],
    category: 'methodology',
    adjacent: ['terraform', 'ansible', 'devops-domain'],
  },

  // ── Soft Skills ────────────────────────────────────────────────────────
  {
    id: 'leadership',
    name: 'Leadership',
    aliases: ['team lead', 'team leadership', 'tech lead', 'leading teams'],
    category: 'soft-skill',
    adjacent: ['teamwork', 'communication', 'project-management'],
  },
  {
    id: 'communication',
    name: 'Communication',
    aliases: ['communication skills', 'verbal communication', 'written communication', 'presentation skills', 'public speaking'],
    category: 'soft-skill',
    adjacent: ['teamwork', 'leadership'],
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    aliases: ['problem solving skills', 'analytical thinking', 'critical thinking', 'logical thinking', 'analytical skills'],
    category: 'soft-skill',
    adjacent: ['data-structures', 'competitive-programming'],
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    aliases: ['team work', 'collaboration', 'team player', 'interpersonal skills'],
    category: 'soft-skill',
    adjacent: ['communication', 'leadership', 'agile'],
  },
  {
    id: 'time-management',
    name: 'Time Management',
    aliases: ['time management skills', 'deadline management', 'prioritization'],
    category: 'soft-skill',
    adjacent: ['project-management', 'agile'],
  },
  {
    id: 'project-management',
    name: 'Project Management',
    aliases: ['pm', 'project mgmt'],
    category: 'soft-skill',
    adjacent: ['agile', 'scrum', 'jira', 'leadership', 'time-management'],
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    aliases: ['flexibility', 'quick learner', 'fast learner', 'willingness to learn'],
    category: 'soft-skill',
    adjacent: ['problem-solving', 'teamwork'],
  },
  {
    id: 'creativity',
    name: 'Creativity',
    aliases: ['creative thinking', 'innovation', 'creative problem solving'],
    category: 'soft-skill',
    adjacent: ['problem-solving', 'ui-ux'],
  },
  {
    id: 'mentoring',
    name: 'Mentoring',
    aliases: ['mentorship', 'coaching', 'training'],
    category: 'soft-skill',
    adjacent: ['leadership', 'communication'],
  },

  // ── Domains ────────────────────────────────────────────────────────────
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    aliases: ['ml', 'machine learning', 'ml engineering'],
    category: 'domain',
    adjacent: ['deep-learning', 'data-science', 'python', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer-vision'],
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning',
    aliases: ['dl', 'neural networks', 'neural network', 'ann', 'cnn', 'rnn', 'lstm', 'transformer', 'transformers'],
    category: 'domain',
    adjacent: ['machine-learning', 'tensorflow', 'pytorch', 'nlp', 'computer-vision'],
  },
  {
    id: 'nlp',
    name: 'Natural Language Processing',
    aliases: ['nlp', 'natural language processing', 'text mining', 'text analytics', 'llm', 'large language models', 'gpt', 'bert'],
    category: 'domain',
    adjacent: ['machine-learning', 'deep-learning', 'python'],
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision',
    aliases: ['cv', 'image processing', 'image recognition', 'object detection'],
    category: 'domain',
    adjacent: ['machine-learning', 'deep-learning', 'opencv', 'python'],
  },
  {
    id: 'data-science',
    name: 'Data Science',
    aliases: ['ds', 'data analytics', 'data analysis', 'data analyst', 'data engineering', 'data engineer'],
    category: 'domain',
    adjacent: ['machine-learning', 'python', 'sql', 'pandas', 'numpy', 'statistics', 'big-data'],
  },
  {
    id: 'statistics',
    name: 'Statistics',
    aliases: ['statistical analysis', 'probability', 'probability and statistics', 'biostatistics'],
    category: 'domain',
    adjacent: ['data-science', 'r', 'machine-learning'],
  },
  {
    id: 'big-data',
    name: 'Big Data',
    aliases: ['big data analytics', 'big data engineering'],
    category: 'domain',
    adjacent: ['spark', 'hadoop', 'data-science', 'kafka'],
  },
  {
    id: 'data-visualization',
    name: 'Data Visualization',
    aliases: ['data viz', 'dataviz'],
    category: 'domain',
    adjacent: ['d3', 'tableau', 'power-bi', 'data-science'],
  },
  {
    id: 'web-development',
    name: 'Web Development',
    aliases: ['web dev', 'full stack', 'fullstack', 'full-stack', 'frontend', 'front end', 'front-end', 'backend', 'back end', 'back-end', 'mern', 'mean', 'mern stack', 'mean stack'],
    category: 'domain',
    adjacent: ['html', 'css', 'javascript', 'react', 'nodejs'],
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    aliases: ['mobile dev', 'mobile app development', 'app development'],
    category: 'domain',
    adjacent: ['android-development', 'ios-development', 'flutter', 'react-native'],
  },
  {
    id: 'android-development',
    name: 'Android Development',
    aliases: ['android dev', 'android app', 'android'],
    category: 'domain',
    adjacent: ['kotlin', 'java', 'flutter', 'mobile-development'],
  },
  {
    id: 'ios-development',
    name: 'iOS Development',
    aliases: ['ios dev', 'ios app', 'ios'],
    category: 'domain',
    adjacent: ['swift', 'flutter', 'mobile-development'],
  },
  {
    id: 'cloud-computing',
    name: 'Cloud Computing',
    aliases: ['cloud', 'cloud engineering', 'cloud architect', 'cloud infrastructure'],
    category: 'domain',
    adjacent: ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'devops-domain'],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    aliases: ['cyber security', 'information security', 'infosec', 'network security', 'application security', 'appsec', 'ethical hacking', 'penetration testing', 'pentest'],
    category: 'domain',
    adjacent: ['linux', 'networking', 'cloud-computing'],
  },
  {
    id: 'iot',
    name: 'Internet of Things',
    aliases: ['iot', 'internet of things', 'embedded iot', 'smart devices'],
    category: 'domain',
    adjacent: ['embedded-systems', 'python', 'c', 'networking'],
  },
  {
    id: 'embedded-systems',
    name: 'Embedded Systems',
    aliases: ['embedded', 'embedded programming', 'rtos', 'microcontroller', 'arduino', 'raspberry pi'],
    category: 'domain',
    adjacent: ['c', 'cpp', 'iot'],
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    aliases: ['web3', 'web 3', 'smart contracts', 'solidity', 'ethereum', 'crypto', 'defi', 'nft'],
    category: 'domain',
    adjacent: ['javascript', 'python', 'distributed-systems'],
  },
  {
    id: 'game-development',
    name: 'Game Development',
    aliases: ['game dev', 'unity', 'unreal engine', 'unreal', 'gamedev'],
    category: 'domain',
    adjacent: ['cpp', 'lua', 'three-js'],
  },
  {
    id: 'ui-ux',
    name: 'UI/UX Design',
    aliases: ['ui ux', 'ui/ux', 'ux design', 'ui design', 'user experience', 'user interface', 'interaction design', 'ux research'],
    category: 'domain',
    adjacent: ['figma', 'web-development', 'accessibility', 'creativity'],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    aliases: ['a11y', 'wcag', 'aria', 'screen reader', 'accessible design'],
    category: 'domain',
    adjacent: ['html', 'web-development', 'ui-ux'],
  },
  {
    id: 'networking',
    name: 'Networking',
    aliases: ['computer networking', 'tcp/ip', 'tcp ip', 'dns', 'http', 'https', 'network protocols', 'ccna'],
    category: 'domain',
    adjacent: ['cybersecurity', 'linux', 'cloud-computing'],
  },
  {
    id: 'distributed-systems',
    name: 'Distributed Systems',
    aliases: ['distributed computing'],
    category: 'domain',
    adjacent: ['microservices', 'system-design', 'cloud-computing', 'kafka'],
  },
  {
    id: 'database-design',
    name: 'Database Design',
    aliases: ['db design', 'schema design', 'data modeling', 'er diagram', 'normalization'],
    category: 'domain',
    adjacent: ['sql', 'postgresql', 'mysql', 'system-design'],
  },
  {
    id: 'api-development',
    name: 'API Development',
    aliases: ['api design', 'api'],
    category: 'domain',
    adjacent: ['rest', 'graphql', 'microservices', 'postman'],
  },
  {
    id: 'competitive-programming',
    name: 'Competitive Programming',
    aliases: ['cp', 'competitive coding', 'leetcode', 'codeforces', 'hackerrank', 'codechef'],
    category: 'domain',
    adjacent: ['data-structures', 'cpp', 'problem-solving'],
  },
  {
    id: 'software-architecture',
    name: 'Software Architecture',
    aliases: ['software design', 'architecture patterns'],
    category: 'domain',
    adjacent: ['design-patterns', 'system-design', 'microservices'],
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    aliases: ['kafka', 'apache kafka', 'kafka streams'],
    category: 'domain',
    adjacent: ['distributed-systems', 'big-data', 'microservices'],
  },
  {
    id: 'signal-processing',
    name: 'Signal Processing',
    aliases: ['dsp', 'digital signal processing'],
    category: 'domain',
    adjacent: ['matlab', 'python'],
  },
  {
    id: 'webassembly',
    name: 'WebAssembly',
    aliases: ['wasm', 'web assembly'],
    category: 'domain',
    adjacent: ['rust', 'cpp', 'javascript'],
  },
  {
    id: 'nosql',
    name: 'NoSQL',
    aliases: ['no sql', 'nosql databases'],
    category: 'domain',
    adjacent: ['mongodb', 'redis', 'cassandra', 'dynamodb'],
  },
  {
    id: 'regex',
    name: 'Regular Expressions',
    aliases: ['regex', 'regexp', 'regular expression'],
    category: 'domain',
    adjacent: ['perl', 'python', 'javascript'],
  },
  {
    id: 'apollo',
    name: 'Apollo',
    aliases: ['apollo client', 'apollo server', 'apollo graphql'],
    category: 'library',
    adjacent: ['graphql', 'react', 'nodejs'],
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    aliases: ['wp', 'word press'],
    category: 'domain',
    adjacent: ['php', 'mysql', 'web-development'],
  },
  {
    id: 'jamstack',
    name: 'Jamstack',
    aliases: ['jam stack'],
    category: 'domain',
    adjacent: ['netlify', 'vercel', 'nextjs', 'web-development'],
  },
  {
    id: 'erlang',
    name: 'Erlang',
    aliases: ['otp', 'erlang otp'],
    category: 'language',
    adjacent: ['elixir', 'distributed-systems'],
  },
  {
    id: 'webgl',
    name: 'WebGL',
    aliases: ['web gl'],
    category: 'domain',
    adjacent: ['three-js', 'javascript'],
  },
  {
    id: 'real-time',
    name: 'Real-time Systems',
    aliases: ['real time', 'realtime'],
    category: 'domain',
    adjacent: ['socket-io', 'nodejs'],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    aliases: ['observability', 'apm'],
    category: 'domain',
    adjacent: ['prometheus', 'grafana', 'devops-domain'],
  },
  {
    id: 'logging',
    name: 'Logging',
    aliases: ['log management'],
    category: 'domain',
    adjacent: ['elasticsearch', 'devops-domain', 'monitoring'],
  },
  {
    id: 'caching',
    name: 'Caching',
    aliases: ['cache', 'cache management'],
    category: 'domain',
    adjacent: ['redis', 'cdn'],
  },
  {
    id: 'cdn',
    name: 'CDN',
    aliases: ['content delivery network'],
    category: 'domain',
    adjacent: ['cloudflare', 'web-development', 'caching'],
  },
  {
    id: 'documentation',
    name: 'Documentation',
    aliases: ['technical writing', 'tech writing', 'api documentation'],
    category: 'domain',
    adjacent: ['confluence', 'communication'],
  },
  {
    id: 'graph-theory',
    name: 'Graph Theory',
    aliases: ['graph algorithms'],
    category: 'domain',
    adjacent: ['neo4j', 'data-structures'],
  },
];

// ---------------------------------------------------------------------------
// Index Construction (O(1) lookups)
// ---------------------------------------------------------------------------

/** alias (lowercased) -> canonical skill ID */
const aliasIndex: Map<string, string> = new Map();

/** canonical ID -> SkillNode */
const nodeIndex: Map<string, SkillNode> = new Map();

/** category -> SkillNode[] */
const categoryIndex: Map<SkillCategory, SkillNode[]> = new Map();

function buildIndices(): void {
  for (const node of SKILLS) {
    nodeIndex.set(node.id, node);

    // Index the canonical ID itself as a lookup key
    aliasIndex.set(node.id, node.id);
    // Index the display name (lowercased)
    aliasIndex.set(node.name.toLowerCase(), node.id);
    // Index every alias
    for (const alias of node.aliases) {
      aliasIndex.set(alias.toLowerCase(), node.id);
    }

    // Build category index
    const existing = categoryIndex.get(node.category) ?? [];
    existing.push(node);
    categoryIndex.set(node.category, existing);
  }
}

buildIndices();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalize free-text skill string to its canonical taxonomy ID.
 * Returns null when the skill is not in the taxonomy.
 *
 * Lookup chain: exact alias match on lowercased, trimmed input.
 */
export function normalizeSkill(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return aliasIndex.get(key) ?? null;
}

/** Retrieve the full SkillNode for a canonical ID. */
export function getSkillNode(id: string): SkillNode | null {
  return nodeIndex.get(id) ?? null;
}

/** Get IDs of skills adjacent to the given skill ID. */
export function getAdjacentSkills(id: string): string[] {
  return nodeIndex.get(id)?.adjacent ?? [];
}

/** Get all skills belonging to a category. */
export function getSkillsByCategory(category: SkillCategory): SkillNode[] {
  return categoryIndex.get(category) ?? [];
}

/**
 * Batch-normalize an array of raw skill strings.
 * Returns matched SkillNodes (deduplicated) and unmatched raw strings.
 */
export function matchSkillsToTaxonomy(rawSkills: string[]): MatchResult {
  const matched: SkillNode[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawSkills) {
    const id = normalizeSkill(raw);
    if (id && !seen.has(id)) {
      seen.add(id);
      const node = nodeIndex.get(id);
      if (node) matched.push(node);
    } else if (!id) {
      unmatched.push(raw);
    }
  }

  return { matched, unmatched };
}

/**
 * Compare resume skills against JD skills using taxonomy adjacency.
 *
 * Scoring:
 *  - exact match  = 1.0 per JD skill
 *  - adjacent hit = 0.5 per JD skill (resume has a neighbor of the JD skill)
 *  - missing      = 0.0
 *  - score = sum / jdSkills.length  (0 when JD is empty)
 *
 * All inputs are raw strings; they get normalized internally.
 */
export function computeSkillOverlap(
  resumeSkills: string[],
  jdSkills: string[],
): SkillOverlapResult {
  if (jdSkills.length === 0) {
    return { exact: [], adjacent: [], missing: [], score: 0 };
  }

  // Normalize resume skills into a Set of canonical IDs
  const resumeIds = new Set<string>();
  for (const raw of resumeSkills) {
    const id = normalizeSkill(raw);
    if (id) resumeIds.add(id);
  }

  // Pre-compute the set of all skills adjacent to the resume's skills
  const resumeAdjacentIds = new Set<string>();
  for (const rid of resumeIds) {
    for (const adj of getAdjacentSkills(rid)) {
      if (!resumeIds.has(adj)) {
        resumeAdjacentIds.add(adj);
      }
    }
  }

  const exact: string[] = [];
  const adjacent: string[] = [];
  const missing: string[] = [];
  const processedJd = new Set<string>();

  for (const raw of jdSkills) {
    const id = normalizeSkill(raw);
    if (!id) {
      missing.push(raw);
      continue;
    }
    // Deduplicate JD skills
    if (processedJd.has(id)) continue;
    processedJd.add(id);

    if (resumeIds.has(id)) {
      exact.push(id);
    } else if (resumeAdjacentIds.has(id)) {
      adjacent.push(id);
    } else {
      missing.push(id);
    }
  }

  const totalJd = exact.length + adjacent.length + missing.length;
  const score = totalJd > 0
    ? (exact.length * 1.0 + adjacent.length * 0.5) / totalJd
    : 0;

  return { exact, adjacent, missing, score };
}
