// /mnt/experiments/astha-resume/src/saathi/engine/responseBank.ts

export type ResponseKey =
  | 'greeting'
  | 'warmup.name_ack'
  | 'warmup.location_ack'
  | 'warmup.target_role_ask'
  | 'education.ask'
  | 'education.acknowledged'
  | 'education.gpa_ask'
  | 'experience.ask'
  | 'experience.role_ack'
  | 'experience.bullets_ask'
  | 'experience.another_ask'
  | 'projects.ask'
  | 'projects.tech_ask'
  | 'projects.outcome_ask'
  | 'projects.another_ask'
  | 'skills.confirm'
  | 'skills.missing_ask'
  | 'wrapup.contact_ask'
  | 'wrapup.summary_offer'
  | 'review.show'
  | 'review.edit_ask'
  | 'deviation.return'
  | 'encouragement'
  | 'clarification';

/**
 * 200+ natural response variants organized by conversation phase.
 * Warm, encouraging, concise. Never corporate-speak.
 * Variables: {{name}}, {{degree}}, {{institution}}, {{year}}, {{field}},
 *            {{company}}, {{role}}, {{skill}}, {{project}}, {{location}},
 *            {{target_role}}, {{skills_list}}
 */
export const RESPONSE_TEMPLATES: Record<ResponseKey, string[]> = {
  greeting: [
    "Hey! I'm Saathi, your resume companion. I'm here to help you put your best self forward. Just talk to me like you would a friend. Any language. Ready when you are.",
    "Welcome! Building a resume shouldn't feel like homework. I'll ask a few questions, you talk, and I'll handle the rest. Sound good?",
    "Hi there! Let's build something that shows who you really are. Speak, type, mix languages. Whatever feels natural. Let's start with the basics: what's your name?",
    "Hello! Think of me as your career buddy. No boring forms, just a conversation. Tell me your name and we'll get started.",
    "Hey! I'm Saathi. Let's skip the form-filling and just talk. What's your name?",
    "Hi! Resume building should be a conversation, not a chore. I'm Saathi, and I'm here to help. What should I call you?",
    "Welcome! I'm Saathi. Let's build your resume together through a simple chat. No stress, no pressure. What's your name?",
    "Hey there! Ready to build a resume that actually represents you? I'm Saathi, your companion for this. What's your name?",
  ],

  'warmup.name_ack': [
    "Nice to meet you, {{name}}! Where are you based?",
    "Great name, {{name}}! Which city are you in?",
    "Hey {{name}}! Good to have you here. Where do you live?",
    "{{name}}, welcome! Tell me where you're located.",
    "Perfect, {{name}}. What city or town are you in?",
    "Got it, {{name}}! And where are you currently based?",
    "{{name}}! Love it. Where are you calling from?",
    "Welcome aboard, {{name}}. Where are you located right now?",
    "Awesome, {{name}}. Quick one: which city are you in?",
    "{{name}}, great to meet you! What's your current location?",
  ],

  'warmup.location_ack': [
    "{{location}}, nice! What kind of role are you looking for?",
    "Cool, {{location}}! What type of work are you interested in?",
    "Got it, {{location}}. What's the dream job? Or at least the next one you're aiming for?",
    "{{location}}! What role or field are you targeting?",
    "Nice, {{location}}. What are you looking to do career-wise?",
    "{{location}}, got it. What kind of positions are you going after?",
    "Great, {{location}}! So what's the goal? What kind of role excites you?",
    "{{location}}, solid. What type of job are you after?",
    "Noted, {{location}}. What's the role you're going for?",
    "{{location}}! Now tell me, what kind of work gets you excited?",
  ],

  'warmup.target_role_ask': [
    "What kind of role are you looking for?",
    "What type of job are you targeting?",
    "What's the dream role? Even a rough idea helps.",
    "Any specific job title or field you're aiming for?",
    "What work would you love to do?",
    "Tell me about the role you're looking for.",
    "What position are you going after?",
    "What's your target role or industry?",
  ],

  'education.ask': [
    "Let's talk about your education. What degree did you pursue, and from where?",
    "Now let's cover your academics. Where did you study, and what was your degree?",
    "Tell me about your education. Degree, college, the basics.",
    "Time for the education section. What did you study and where?",
    "Let's get your education down. What degree and which institution?",
    "Moving on to education! What's your educational background?",
    "What about your studies? Degree, institution, and year.",
    "Let's build your education section. Walk me through it.",
    "Next up: education. What degree did you complete, and from which college?",
    "Tell me about where you studied. Degree, institution, year, field.",
  ],

  'education.acknowledged': [
    "{{degree}} from {{institution}}, solid foundation! What have you been up to since {{year}}?",
    "Nice, {{institution}}! {{field}} is a great field. Did you do any internships during college?",
    "Got it. {{degree}} in {{field}}, {{institution}}, {{year}}. Tell me about your work experience.",
    "{{institution}}, {{year}}. {{field}} is a solid choice. Any work experience to add?",
    "Great, {{degree}} from {{institution}}. {{field}} opens a lot of doors. Let's talk about what you did next.",
    "{{institution}} in {{year}}, nice. Did you pick up any work experience along the way?",
    "{{degree}} in {{field}} from {{institution}}. Good stuff. What about work experience?",
    "Noted! {{institution}}, {{year}}, {{field}}. Now let's talk about what you've done professionally.",
    "{{degree}} from {{institution}} in {{year}}. Strong background. Any jobs or internships?",
    "{{institution}}, {{field}}, {{year}}. Let's build on that. Tell me about your experience.",
  ],

  'education.gpa_ask': [
    "What was your GPA or percentage? Totally optional, but it can help if it's strong.",
    "Got a GPA or CGPA you'd like to include? No pressure if not.",
    "Any GPA or percentage to add? Only if you want to.",
    "Did you want to include your academic score? GPA, CGPA, or percentage?",
    "Optional: what was your GPA? If it's good, it's worth mentioning.",
    "Any GPA to include? This is optional, skip if you prefer.",
    "Your call: want to add your GPA or percentage?",
    "If you have a strong GPA, it's worth listing. Want to include it?",
  ],

  'experience.ask': [
    "Tell me about your work experience. Company, role, and what you did there.",
    "Let's talk experience. Any jobs, internships, or freelance work?",
    "What about work? Any companies, roles, or internships?",
    "Now for experience. Walk me through your professional history.",
    "Time for work experience! What have you done professionally?",
    "Have you worked anywhere? Internships count too. Tell me about it.",
    "Let's get your experience down. Company name, your role, what you did.",
    "Any work experience? Jobs, internships, freelance. All counts.",
    "What's your professional background? Talk me through it.",
    "Let's cover your work history. Start with the most recent.",
  ],

  'experience.role_ack': [
    "{{role}} at {{company}}, nice! What did you actually do there? Give me the highlights.",
    "Got it, {{role}} at {{company}}. Tell me about your main accomplishments there.",
    "{{company}}, {{role}}. What were your biggest wins in that role?",
    "{{role}} at {{company}}. Walk me through what you worked on.",
    "Nice, {{role}} at {{company}}! What were you responsible for?",
    "{{company}}, {{role}}. What's the coolest thing you did there?",
    "Got it! {{role}} at {{company}}. Tell me what you built or achieved.",
    "{{role}} at {{company}}, interesting! What did that involve day to day?",
    "{{company}} as {{role}}. Tell me about your key contributions.",
    "Nice! {{role}} at {{company}}. What should a recruiter know about your time there?",
  ],

  'experience.bullets_ask': [
    "What else did you do in that role? Any other achievements or projects?",
    "Anything else from that position? Numbers and results are gold.",
    "Any other highlights from {{company}}? Think impact and results.",
    "More to add from that role? Every achievement counts.",
    "What else stands out from your time there?",
    "Any other wins from {{company}}? Don't be modest.",
    "Got it. Anything else from that role worth mentioning?",
    "More from {{company}}? Think about things you improved or built.",
  ],

  'experience.another_ask': [
    "Any other work experience to add? More roles, internships, freelance?",
    "Do you have another role to add? Or should we move on?",
    "Any more positions to include? Or ready for the next section?",
    "Another job or internship? Or shall we talk about projects?",
    "More experience to add? If not, let's move to projects.",
    "Any other roles? Say 'no' if we're good, and I'll move on.",
    "Got that covered. Any more work experience, or should we continue?",
    "Another position to add? Otherwise, let's talk projects.",
  ],

  'projects.ask': [
    "Let's talk projects. What have you built? Side projects, academic work, anything you're proud of.",
    "Now for projects! Tell me about something you've built or worked on.",
    "Any projects to showcase? Personal, academic, open source. All fair game.",
    "Projects time! What's something you've built that you're proud of?",
    "Tell me about a project. What did you build, what tech did you use, what was the result?",
    "Let's add some projects. What have you created or contributed to?",
    "Do you have any projects? These really stand out for freshers. Tell me about one.",
    "Projects are where you shine. What have you worked on?",
    "Got any projects to add? They're huge for standing out. Walk me through one.",
    "What have you built? Personal projects, hackathon work, academic projects. All count.",
  ],

  'projects.tech_ask': [
    "What tech stack did you use for {{project}}?",
    "What technologies went into building {{project}}?",
    "What did you build {{project}} with? Languages, frameworks, tools.",
    "Tech stack for {{project}}? Languages, libraries, databases.",
    "What tools and technologies powered {{project}}?",
    "For {{project}}, what was the tech? Languages, frameworks, anything.",
    "What was the tech behind {{project}}?",
    "Technologies used in {{project}}? Hit me with the list.",
  ],

  'projects.outcome_ask': [
    "What was the result? Any numbers, users, or impact?",
    "What outcome did {{project}} achieve? Users, speed, downloads, anything measurable.",
    "How did {{project}} turn out? Any metrics or results?",
    "What was the impact of {{project}}?",
    "Any measurable results from {{project}}? Numbers are powerful.",
    "What happened with {{project}}? Users, deployments, recognition?",
    "What's the outcome? Even rough numbers help a lot.",
    "Results for {{project}}? Think users, performance gains, recognition.",
  ],

  'projects.another_ask': [
    "Another project to add? Or ready to move on?",
    "Any more projects? Or should we cover skills next?",
    "Got more projects? Otherwise, let's talk skills.",
    "Another project? Or shall we move to the skills section?",
    "More projects to showcase? If not, let's move on.",
    "Want to add another project? Or are we good here?",
    "Any other projects? Say the word and we'll continue, or I'll move on.",
    "One more project? Or let's wrap up this section.",
  ],

  'skills.confirm': [
    "Based on what you've told me, I've picked up these skills: {{skills_list}}. Anything I missed?",
    "I found these skills in our conversation: {{skills_list}}. Want to add or remove any?",
    "Here are the skills I've gathered: {{skills_list}}. Sound right? Anything to add?",
    "Skills I've detected: {{skills_list}}. Did I miss anything important?",
    "Your skills so far: {{skills_list}}. Any additions or corrections?",
    "I've noted these skills: {{skills_list}}. Anything else you're good at?",
    "Skill check! I got: {{skills_list}}. Anything to add or remove?",
    "From our chat, your skills: {{skills_list}}. Looks right? Want to add more?",
  ],

  'skills.missing_ask': [
    "Any other technical or soft skills to add? Think tools, languages, frameworks.",
    "Anything else? Soft skills count too: leadership, communication, teamwork.",
    "More skills? Cloud platforms, databases, methodologies?",
    "What else? Design tools, testing frameworks, project management?",
    "Any more to add? Don't forget soft skills and methodologies.",
    "Other skills? Agile, Git, Docker, cloud services?",
    "Anything I'm missing? Think about the tools you use daily.",
    "More to add? Every relevant skill improves your match score.",
  ],

  'wrapup.contact_ask': [
    "Almost done! I need your email and phone number for the resume header.",
    "Let's wrap up the essentials. What's your email and phone?",
    "Final details: email address and phone number, please.",
    "Just need your contact info. Email and phone number?",
    "Last bit: what's the best email and phone to reach you?",
    "Quick one: email and phone for the resume?",
    "We're close! Just need your email and phone number.",
    "For the header: your email address and phone number?",
  ],

  'wrapup.summary_offer': [
    "Want me to write a professional summary based on everything you've told me? Or would you prefer to write your own?",
    "I can generate a summary from our conversation. Want me to draft one?",
    "Should I create a professional summary for you? I've got enough to work with.",
    "I can write a summary based on what you've shared. Want me to?",
    "Ready to generate your summary. Should I draft it, or do you have one in mind?",
    "I have enough to write a solid summary. Want me to generate one?",
    "Let me draft a professional summary from our chat. Sound good?",
    "I can create a summary that highlights your strengths. Want me to?",
  ],

  'review.show': [
    "Here's your resume! Take a look and let me know if anything needs changing.",
    "Your resume is ready! Review it below. I can adjust anything you want.",
    "Done! Check out your resume. Want to change anything?",
    "Here it is! Your resume, built from our conversation. Any edits?",
    "Resume complete! Look it over. I can tweak anything that doesn't feel right.",
    "All set! Here's what we built together. Any final adjustments?",
    "Your resume is ready for review. Take a look and tell me what to change.",
    "Tada! Here's your resume. Any last edits before you download?",
  ],

  'review.edit_ask': [
    "What would you like to change? Just tell me and I'll update it.",
    "What needs adjusting? I can modify any section.",
    "Which part needs work? Tell me what to fix.",
    "Any changes? Just say what needs updating.",
    "What should I change? Point me to the section.",
    "What needs editing? I'll make it happen.",
    "Tell me what to adjust. I'm all ears.",
    "What's not right? Let's fix it together.",
  ],

  'deviation.return': [
    "Got it! By the way, you mentioned {{field}} earlier. What year did you graduate?",
    "Noted. Quick thing: we still need your {{field}}. Can you fill that in?",
    "Sure! Oh, one thing: I'm still missing your {{field}}. Want to add it?",
    "No problem. Coming back to something: what's your {{field}}?",
    "Understood! Let me circle back. We're still missing {{field}}.",
    "Makes sense. Going back a step: I need your {{field}}. What is it?",
    "Got it! Also, I noticed we're missing {{field}}. Can you share that?",
    "Cool. One gap though: your {{field}}. Can you fill me in?",
  ],

  encouragement: [
    "You're doing great! Almost there.",
    "This is shaping up nicely.",
    "Strong background! Let's keep going.",
    "Looking good so far!",
    "Nice work. You've got solid experience.",
    "Great stuff. Just a few more things.",
    "This resume is coming together well!",
    "Impressive! Let's keep building.",
    "You've got more to offer than you think.",
    "Keep going. Every detail matters.",
    "Good progress! We're getting close.",
    "This is going to be a strong resume.",
    "Nice! Let's round this out.",
    "You've got a lot to show. Let's capture it all.",
    "Solid! A few more questions and we're done.",
    "Looking great, {{name}}! Almost finished.",
    "Your resume is really coming along.",
    "You're a natural at this. Keep going!",
    "Love it. Just a bit more.",
    "That's the kind of detail recruiters love.",
  ],

  clarification: [
    "I didn't quite catch that. Could you rephrase?",
    "Hmm, I'm not sure I understood. Can you say that differently?",
    "Could you clarify? I want to get this right.",
    "Not sure I followed. Can you try again?",
    "I want to make sure I get this right. Could you explain again?",
    "Let me make sure I understand. Can you rephrase?",
    "Sorry, I missed that. One more time?",
    "Can you say that again? I want to be accurate.",
    "Not quite sure I got that. Could you elaborate?",
    "I want to capture this correctly. Can you rephrase?",
  ],
};

// Track last used index per key to rotate variants
const _lastIndex: Map<ResponseKey, number> = new Map();

function pickVariant(key: ResponseKey): string {
  const variants = RESPONSE_TEMPLATES[key];
  if (!variants || variants.length === 0) return '';
  const last = _lastIndex.get(key) ?? -1;
  const next = (last + 1) % variants.length;
  _lastIndex.set(key, next);
  return variants[next];
}

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  // Remove any remaining template markers
  result = result.replaceAll(/\{\{[^}]+\}\}/g, '');
  return result;
}

export function getGreeting(): string {
  return pickVariant('greeting');
}

export function getResponse(key: ResponseKey, vars: Record<string, string>): string {
  return interpolate(pickVariant(key), vars);
}
