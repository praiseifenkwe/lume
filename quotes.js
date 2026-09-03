/* ============================================================
   Liquid Tab — built-in quote library
   Each entry: [text, author, category]
   Total quotes: 412 (205 Alex Hormozi, 207 Leila Hormozi)
   ============================================================ */

const QUOTE_CATEGORIES = {
  alex:  "Alex Hormozi",
  leila: "Leila Hormozi",
};

const QUOTES = [
  [
    "You don't become confident by shouting affirmations in the mirror, but by having a stack of undeniable proof that you are who you say you are. Outwork your self-doubt.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "A focused fool can accomplish more than a distracted genius.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Volume negates luck.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The degree of the pain will determine the degree of the solution needed.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You have to do the boring work that nobody wants to do for longer than anyone else is willing to do it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Make offers so good people feel stupid saying no.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't have a motivation problem, you have a clarity problem.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you can't decide between two choices, pick the harder one. It builds character.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The work works. Just keep doing it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to be successful, you must become comfortable being misunderstood for long periods of time.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Skill is the bridge between desire and reality.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't measure your progress by how you feel. Measure it by what you did.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Most people don't fail because of lack of talent; they fail because they quit before the compound effect kicks in.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The person who can endure the most boredom wins.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Simple scales, fancy fails.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You are not tired from doing too much. You are tired from doing too little of what matters.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best way to build confidence is to do the things you told yourself you were going to do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If it were easy, everyone would do it. The difficulty is the barrier to entry that protects your upside.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The single greatest hack in business is doing what you said you would do, when you said you would do it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Impatience with actions, patience with results.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't need another course, you need more reps.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The pain of regret is far worse than the pain of discipline.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Stop looking for the secret. The secret is that you have to do the thing 10,000 times.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Ignorance is the only reason people aren't rich. If you knew how to make a million dollars, you would have already done it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Hard times create strong people. Embrace the suck.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Success comes down to doing the obvious thing for an uncomfortably long period of time.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Overnight success is a 10-year story packed into a 10-minute podcast.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Fear of failure is just fear of looking foolish to people whose opinions don't matter.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The market doesn't care about your effort, it only cares about your value.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to make more money, solve bigger problems for wealthier people.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Speed is a competitive advantage. Slow is expensive.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Action creates clarity. Inaction creates anxiety.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You are paying an ignorance tax on everything you don't know how to do yet.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to change your life, change what you do every day between 6 AM and 8 AM, or 6 PM and 8 PM.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't judge the day by the harvest you reap, but by the seeds you plant.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You can't lose if you don't quit, and you can't win if you don't start.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Entrepreneurship is about eating glass and staring into the abyss of failure every day until you win.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The more you charge, the more value clients perceive, and the better results they get.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Price is what you pay. Value is what you get. Charge based on the outcome, not the hours.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to be exceptional, you have to be comfortable being an outlier.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Consistency is the ultimate flex. Anyone can sprint, but few can run a marathon every day.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "People who avoid failure also avoid success. You have to fail your way forward.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Great businesses are built on word of mouth, not just paid ads.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The biggest risk is taking no risk at all in a world that is changing rapidly.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your reputation is your most valuable asset. Guard it with your life.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The easiest way to make money is to find someone who is already spending money and give them a better solution.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you can sell and you can build, you are unstoppable.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Sales is not convincing someone to buy something they don't need; it's uncovering a problem they already have and showing them how to fix it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The longer you can delay gratification, the more successful you will become.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Wealth is what you don't see. It's the cars not bought, the watches not worn, and the first-class tickets declined.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't take advice from people who haven't accomplished what you want to achieve.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Most decisions in life are reversible. Make them quickly and correct along the way.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The goal is not to look rich, the goal is to be rich.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't need passion to succeed; you need commitment and discipline.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The highest return on investment you will ever get is investing in your own skills.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want more output, increase the quality of your inputs.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Focus on being effective, not just being busy.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The easiest way to stand out in business is simply doing what you promised you would do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Every failure contains a lesson. If you learn it, the failure wasn't a loss, it was tuition.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't get paid for the hour. You get paid for the value you bring to the hour.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to grow, you have to be willing to feel uncomfortable every single day.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best marketing is a product so good that people can't stop talking about it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Never compete on price alone. Compete on value, speed, and guarantee.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The people who win aren't smarter than you; they just refuse to quit when it gets hard.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your income is directly proportional to the difficulty of the problems you can solve.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't let yesterday take up too much of today.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The secret to productivity is saying no to 99% of things that don't move the needle.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The only person you should try to be better than is the person you were yesterday.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Build something so valuable that people would feel like losers if they didn't buy it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Most people overestimate what they can do in a day and underestimate what they can do in a decade.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Discipline beats motivation every single day of the week.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to scale, you must build systems that work without you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The greatest competitive advantage in the modern world is the ability to focus without distraction.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Never assume you know what the customer wants. Ask them, listen, and deliver.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't need more resources, you need to be more resourceful.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Confidence without evidence is just delusion. Build the evidence first.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your life today is the exact sum of the decisions you made over the last five years.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best time to plant a tree was 20 years ago. The second best time is right now.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Work so hard that when luck knocks on your door, you are ready to answer.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Be humble enough to learn from anyone, but confident enough to believe you can beat everyone.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Stop waiting for conditions to be perfect. Start where you are, use what you have, and do what you can.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The only failure that truly counts is the one from which you learn nothing.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't fear rejection; fear a life lived below your potential.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The true price of anything you do is the amount of life you exchange for it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want extraordinary results, you must take extraordinary actions.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The quickest way to double your revenue is to double the value of your offer.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Treat every customer like they are your only customer.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You cannot build a great business on average standards.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The marketplace rewards courage, execution, and stamina.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Master the fundamentals before you try to get fancy.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "A bad day for your ego is often a great day for your growth.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your competitors are hoping you give up today. Don't give them the satisfaction.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you don't manage your time, someone else will gladly manage it for you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "High standards are contagious. Surround yourself with people who raise yours.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The greatest prison people live in is the fear of what other people think.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Spend your time on things that have unlimited upside and zero downside.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "True leverage is having systems, code, and content working for you while you sleep.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "When you feel like quitting, remember why you started in the first place.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The bridge between dreams and reality is called hard, focused, daily execution.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't worry about being the smartest person in the room; worry about being the hardest worker in the room.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Opportunities multiply as they are seized.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The world is full of educated derelicts. Persistence and determination alone are omnipotent.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best investment you can make is in yourself. The more you learn, the more you earn.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "To double your net worth, double your learning rate.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't need permission to be great. You just need to show up and do the work.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best revenge against doubt is massive, undeniable success.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Pressure is a privilege. It means something is expected of you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Do what is hard now so your life will be easy later. If you do what is easy now, your life will be hard later.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You are one decision away from a totally different life.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Energy flows where attention goes. Guard your attention with your life.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Keep your head down, do the reps, and let the scoreboard take care of itself.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The biggest difference between winners and losers is that winners do the things they don't feel like doing.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Stop complaining about what you didn't get with the work you didn't do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Simplicity is the prerequisite for reliability.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "When you master the art of deep focus, you leave the rest of the world behind.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Winning isn't normal. If you want to win, you have to do things normal people won't do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best marketing strategy ever is caring more about your clients than anyone else in your industry.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your level of success will rarely exceed your level of personal development.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "A goal without a plan and daily execution is just a daydream.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Every action you take is a vote for the type of person you wish to become.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't downgrade your dream just to fit your current reality. Upgrade your conviction to match your destiny.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you are not willing to learn, no one can help you. If you are determined to learn, no one can stop you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Build assets that compound over decades, not income that disappears by next week.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The fastest way to gain respect is to be reliable in an unreliable world.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to change your bank account, first change your calendar.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Success is not owned; it's leased, and rent is due every single day.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The secret of getting ahead is getting started.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Surround yourself with people who talk about ideas and the future, not other people and the past.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Small daily improvements over time lead to stunning results.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Stop asking for lighter burdens; start praying for broader shoulders.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You are only as good as your next rep. Stay hungry, stay humble.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The market rewards clarity and punishes confusion.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Never trade long-term respect for short-term attention.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you can endure more discomfort than your competition, you will eventually win.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Focus on the lead domino. Knock down the one thing that makes everything else easier or unnecessary.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Everything you want is on the other side of consistency.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Greatness is simply doing ordinary things extraordinarily well, day after day.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "There are no traffic jams along the extra mile.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The strongest steel is forged in the hottest fires.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Value is created when you solve problems that others think are impossible or too tedious to tackle.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your beliefs dictate your actions, and your actions dictate your reality.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't wait until you reach your goal to be proud of yourself. Be proud of every step you take toward reaching that goal.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't need a million followers; you need a few hundred clients whose lives you genuinely transform.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "True freedom is not having to do what you don't want to do, with people you don't want to be with.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The secret to scaling is eliminating everything that doesn't serve the core mission.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you fail to plan, you are planning to fail.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The harder you work, the luckier you seem to get.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Action cures fear. Take the first step, and the rest will reveal itself.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Never let success go to your head or failure go to your heart.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Build equity in your mind, your skills, and your network.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The greatest risk in life is living a life without purpose.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "When you outwork your excuses, your potential becomes limitless.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Every champion was once a contender that refused to give up.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You have power over your mind, not outside events. Realize this, and you will find strength.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The secret of business is to know something that nobody else knows, and execute on it relentlessly.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want peace, prepare for war. Build your skills before the storm arrives.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "A year from now you may wish you had started today.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "What gets measured gets managed, and what gets managed gets improved.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't wish it were easier; wish you were better.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your life is shaped by the quality of questions you ask yourself every day.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Hard work beats talent when talent fails to work hard.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The price of greatness is responsibility.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want to achieve greatness, stop asking for permission.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Success is doing what you want, when you want, where you want, with whom you want, as much as you want.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Be so good they can't ignore you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The best view comes after the hardest climb.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You don't drown by falling in the water; you drown by staying there.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Everything is hard before it is easy.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Discipline is the bridge between goals and accomplishment.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Either you run the day, or the day runs you.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Great things never came from comfort zones.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Dream big. Start small. But most of all, start.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Opportunities don't happen. You create them.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "It always seems impossible until it's done.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Do what you have to do until you can do what you want to do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Winners focus on winning; losers focus on winners.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The journey of a thousand miles begins with a single, uncompromising step.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Success is stumbling from failure to failure with no loss of enthusiasm.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Keep your eyes on the stars and your feet firmly planted on the ground.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Do not let what you cannot do interfere with what you can do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Definiteness of purpose is the starting point of all achievement.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Fall seven times, stand up eight.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If opportunity doesn't knock, build a door.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The difference between a successful person and others is not a lack of strength, but rather a lack in will.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your future is created by what you do today, not tomorrow.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Don't watch the clock; do what it does. Keep going.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you want something you've never had, you must be willing to do something you've never done.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Success usually comes to those who are too busy to be looking for it.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Do not wait to strike till the iron is hot; but make it hot by striking.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Great minds discuss ideas; average minds discuss events; small minds discuss people.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "If you genuinely want something, don't wait for it — teach yourself to be impatient for progress.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The secret to winning is simply not stopping when others do.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Character is doing the right thing when nobody is watching.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Focus on being world-class at one thing before you branch into five.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The greatest discovery of all time is that a person can alter his future by merely altering his attitude.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "You cannot have a million-dollar dream with a minimum-wage work ethic.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Your habits will either make you or break you. Choose them wisely.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Doubt kills more dreams than failure ever will.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "The expert in anything was once a beginner.",
    "Alex Hormozi",
    "alex"
  ],
  [
    "Culture isn't what you say on the wall, it's what you tolerate in the hall.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You cannot scale a business until you scale yourself as a leader.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The quality of your business is determined by the quality of the conversations you're avoiding.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leadership is not about being liked, it's about holding people to the standard they committed to.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want a team that takes ownership, you have to give them the room to actually own things.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Clarity breeds confidence, ambiguity breeds anxiety.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Discipline is choosing between what you want now and what you want most.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A bad hire costs you time, money, and energy. A great hire gives you your life back.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't build a massive company by doing everything yourself; you build it by building people.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Feedback is a gift, but only if you have the maturity to unwrap it without getting defensive.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The fastest way to burn out your top performers is by tolerating low performers.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Stop trying to manage time. Start managing your energy and your priorities.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Resilience isn't never falling down. It's how quickly you get back up and figure out what went wrong.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The standard you walk past is the standard you accept.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you feel overwhelmed, look at what you can simplify, delegate, or eliminate.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True confidence comes from keeping promises to yourself when nobody else is watching.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Hiring is not about finding someone who can do the job; it's about finding someone who thrives in your environment.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't grow during the comfortable seasons, you grow in the fire of solving tough problems.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Process isn't bureaucracy — process is how you protect your team from chaos.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want people to respect your boundaries, you have to be the first one who respects them.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your business will only grow to the extent of your ability to manage stress and uncertainty.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't lower the bar so people can jump over it. Raise their skills so they can clear the bar.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Empathy without accountability is just enablement.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Momentum is hard to build and easy to lose. Protect it at all costs.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Lead by example first, instructions second.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you can't manage yourself when things are chaotic, you have no business trying to manage others.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "High performers don't want to be micromanaged; they want clear expectations and the freedom to execute.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Emotional maturity in business is the ability to separate what someone said from how you felt about it.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The hardest person you will ever have to lead is yourself.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great cultures aren't built on free snacks and ping pong tables; they are built on mutual respect, high standards, and shared wins.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When communication breaks down, assume positive intent first before assuming malice or incompetence.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't earn loyalty by demanding it; you earn loyalty by being fiercely loyal to your people's growth.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A leader who avoids conflict is not peaceful; they are selfishly prioritizing their comfort over the team's success.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Delegation without clear accountability is just abdication.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If your team keeps making the same mistake, it's not a people problem; it's a training or process problem.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Be quick to praise in public, and thoughtful to coach in private.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best way to know if someone is a good fit for your culture is to see how they behave when things go wrong.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never make permanent decisions based on temporary emotional reactions.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your job as a leader is to remove friction so your team can do their best work unhindered.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Vulnerability without boundaries is not leadership; it is oversharing. Lead with strength and authenticity.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True influence comes from competence, consistency, and genuine care for others.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The moment you stop investing in your own growth is the moment you put a ceiling on your organization.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Clarity of vision is meaningless without clarity of day-to-day execution.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't need a title to be a leader. You just need to act like someone worth following.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A healthy company culture attracts the right people and violently repels the wrong ones.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want people to trust your judgment, be transparent about the mistakes you make along the way.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Accountability isn't punishment; accountability is the loving commitment to keep someone on their path to excellence.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best managers don't create followers; they create more leaders who think independently.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Stop waiting for people to read your mind. Over-communicate expectations until everyone is aligned.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you hire for character and train for skill, you build an unstoppable organization.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True power is keeping your composure when everyone around you is losing theirs.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is an active decision you make every day, not a status you achieve once.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want to build trust, under-promise and consistently over-deliver.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great teams aren't formed by chance; they are forged through shared adversity and clear alignment.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The most productive meetings are the ones that end with clear owners, clear actions, and clear deadlines.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't let urgent trivial tasks steal time from strategic important priorities.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you aren't hearing tough truths from your team, it's because you haven't made it safe for them to speak up.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your team's performance is an exact mirror of your leadership clarity and accountability.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Celebrate the behaviors you want repeated, not just the final outcomes.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The courage to say no to good opportunities is what makes great opportunities possible.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Being firm on standards doesn't mean you can't be kind in delivery.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A leader's silence in the face of poor performance is interpreted as agreement.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Self-awareness is the foundational superpower of every extraordinary leader.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You cannot inspire others if your own cup is completely empty. Prioritize your mental clarity.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Treat feedback like data, not an attack on your identity.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you hire slowly and fire thoughtfully, your culture becomes your greatest moat.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Real leadership is taking the blame when things go wrong and sharing the credit when things go right.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The strength of a team is measured by how well it operates when the leader is out of the office.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Simple, consistent habits outperform occasional bursts of heroic effort every time.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want your people to innovate, you have to give them permission to fail responsibly.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't look for flawless people; look for humble people who are hungry to improve.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The easiest way to lose top talent is by rewarding tenure over contribution.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your words have weight. Use them to build clarity, not confusion.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is about serving the mission and the people, never your own ego.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you prioritize alignment over consensus, you move faster with less friction.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Every system produces exactly the results it was designed to produce. If you don't like the results, redesign the system.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A great leader doesn't have all the answers; they ask the questions that help the team find them.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best teams are united by shared values, not just shared deadlines.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never let your mood dictate how you treat your people.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Consistency in leadership builds psychological safety, which unlocks peak creativity and performance.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The greatest gift you can give your team is clear, unambiguous expectations.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want a culture of radical ownership, stop rescuing people from the consequences of their mistakes.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Growth demands that you let go of what worked yesterday to embrace what is required today.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Humility isn't thinking less of yourself; it's thinking of yourself less often.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You cannot demand excellence from your team if you accept mediocrity in your personal habits.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The hardest conversation you need to have is almost always the most important one for your growth.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leaders listen more than they speak and observe more than they react.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When everyone knows the scoreboard and the rules, winning becomes a shared obsession.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your culture is defined by the worst behavior your top leader is willing to tolerate.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want loyal customers, first create loyal, engaged, and empowered team members.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True resilience is maintaining your optimism while confronting the brutal facts of your reality.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A good plan executed with urgency today beats a perfect plan next month.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best leaders don't seek validation; they seek truth and results.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Stop avoiding uncomfortable moments. Discomfort is the currency of leadership growth.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You build authority through demonstrated competence, not through force or fear.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A business that depends entirely on one person is not a business; it's an exhausting job.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Protect your calendar like you protect your bank account. Your time is non-renewable.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want high standards, model them in the quiet moments when nobody is keeping score.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is about creating the environment where ordinary people can achieve extraordinary things.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never compromise on core values for short-term financial gains.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The greatest bottleneck in any growing business is almost always the founder's own ego.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Feedback given with genuine empathy and clear specifics is the ultimate catalyst for human growth.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Focus on building deep trust before you demand high compliance.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When leaders take 100% responsibility for everything in their world, problems get solved twice as fast.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The mark of a mature leader is the ability to change their mind when presented with better evidence.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't confuse activity with accomplishment. Measure output, not hours spent in meetings.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A team that shares honest feedback without fear will always outperform a team walking on eggshells.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Celebrate the quiet grinders who keep the engine running, not just the loud talkers in the spotlight.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The difference between a manager and a leader is that a manager directs, while a leader inspires and equips.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want people to care about your vision, you must first show that you care about their future.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Patience with people, urgency with execution.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't need to be the smartest person in the company; you need to be the one who asks the sharpest questions.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Every breakdown in an organization is ultimately an opportunity to upgrade a process or a mindset.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True leadership is steady in the storm and humble in the sunshine.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Hold your standards high, hold your team close, and never stop believing in what is possible together.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best leaders create environments where people feel proud of the hard work they do.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leaders don't just solve problems; they teach their people how to think so the problems don't happen again.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never let fear of conflict prevent you from delivering the truth that someone needs to hear.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your impact as a leader will be measured by the leaders you leave behind, not the followers you gathered.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you take care of your people, your people will take care of your business.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Lead with clarity, live with integrity, and execute with relentless discipline.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When a team feels truly heard, their commitment to the final decision skyrockets.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't build a business that costs you your peace of mind. Build one that gives you freedom and purpose.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The foundation of all great execution is simple: clear roles, clear goals, clear deadlines.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Integrity is doing what you said you would do, long after the mood you said it in has passed.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you align talent with passion and purpose, work stops feeling like a grind and starts feeling like a calling.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Be relentless in your standards, but deeply compassionate with the humans striving to meet them.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A team that trusts each other can out-execute a team with ten times more resources.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best legacy a leader can leave is an organization that thrives long after they step away.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Keep your standards uncompromising, your communication crystal clear, and your heart grounded in gratitude.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is an act of courage: the courage to stand for what is right, even when it is inconvenient.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Success in business is 10% strategy and 90% human alignment and execution.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Every interaction you have with your team either builds trust or erodes it. Make every conversation count.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never sacrifice who you are for what you want to achieve. True victory is winning with your integrity intact.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The most inspiring thing you can do for your team is to continually grow and evolve as a human being.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you lead with love, discipline, and purpose, extraordinary results become the natural byproduct.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Stay grounded in your values, stay curious about your blind spots, and stay committed to the people who trust you.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The ultimate test of leadership is not what happens when you are in the room, but what happens when you leave.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Believe in your team's potential before they even see it in themselves.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leadership is the art of giving people the tools, the courage, and the trust to astonish themselves.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When purpose leads the way, energy follows and obstacles dissolve.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Show up every single day as the leader your team deserves.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "There is no finish line in leadership. The journey of self-mastery is lifelong.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Lead from the front, listen from the heart, and build something that outlives you.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The secret to building a high-performing team is building high-trust relationships one conversation at a time.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you build people, they build the business. It has always been that simple.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Every hard decision you face is an invitation to step into a higher version of your leadership.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Trust is built in drops and lost in buckets. Guard the trust of your team with your life.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The courage to confront reality is the first step toward transforming it.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Keep moving forward with purpose, passion, and an unwavering commitment to excellence.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The most important hire you will ever make is the person who protects your time.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you don't define the values of your company, the lowest common denominator will define them for you.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A high performer in the wrong seat will look like a low performer.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You cannot scale past what you are willing to inspect.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want accountability, stop managing tasks and start managing outcomes.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Culture is the operating system of your business. If it crashes, nothing else runs.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The secret to scaling is removing yourself from every recurring decision.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you promote the top technician to manager without training, you lose a great technician and gain a terrible manager.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A company's growth rate is constrained by the speed at which its leadership can learn.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The cost of avoiding a tough conversation compounds every single day.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leaders don't demand perfection; they insist on honesty, progress, and ownership.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't build a team to save yourself from working. Build a team to expand what is possible.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Burnout doesn't come from working too hard; it comes from working on things that lack meaning or alignment.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best leaders are obsessive about clarity and ruthless about simplicity.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want high retention, create an environment where people feel they are becoming better versions of themselves.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Good intentions without good systems always lead to bad results.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Hire for the stage of company you are entering, not the stage you are leaving.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If a metric doesn't drive a decision, stop tracking it.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The standard for excellence is established by what you celebrate and what you correct.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't build confidence by talking; you build it by delivering on your promises to yourself.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When leaders blame market conditions or their employees, they surrender their power to fix the problem.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The greatest competitive edge in a business is a leadership team that trusts each other implicitly.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A meeting without an agenda is a waste of time; a meeting without decisions is a waste of money.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Empowerment without context is dangerous; context without empowerment is frustrating.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great operations look boring from the outside because consistency is the opposite of chaos.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best leaders are curious before they are critical.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never let loyalty to a past employee jeopardize the future of your entire team.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want team members to think like owners, you must share the numbers like owners.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Speed of execution is a reflection of leadership conviction.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When expectations are clear, accountability is welcomed, not feared.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "True leadership maturity is having the humility to admit when your favorite idea was wrong.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If everything is urgent, then nothing is important.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You can't solve a cultural issue with a software subscription.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Top talent wants to work with other top talent. Never settle for B-players.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The biggest risk in rapid growth is outgrowing your own leadership capacity.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Stop trying to motivate unmotivated people. Hire people who are already driven and give them a reason to run.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is the willingness to absorb uncertainty and project calm, clear direction.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A process that nobody follows is worse than having no process at all.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Great leadership is knowing when to teach, when to guide, and when to get out of the way.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best feedback is immediate, specific, and focused entirely on the future.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Never compromise long-term team trust for a short-term operational victory.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When you invest in people first, business results take care of themselves.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "A leader's calendar reveals their true priorities more than any mission statement.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The strongest teams are built on vulnerability, mutual respect, and relentless pursuit of excellence.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "You don't manage emotions by suppressing them; you manage emotions by understanding what triggers them.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "If you want an autonomous team, teach them how to make decisions using principles rather than rules.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "High performance is not an accident; it is the daily discipline of doing the right things repeatedly.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The best company culture is one where people feel safe enough to take risks and bold enough to innovate.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Leadership is never about the person at the top; it is always about the people doing the work.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Your business reflects who you are. If you want to change your business, change who you are becoming.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "When everyone owns the mission, no one needs to be told what to do.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "The true mark of a great leader is not how much they control, but how much they liberate.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Courage is contagious. When a leader stands up for what is right, the entire team stands taller.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Focus on being the person you would gladly follow into battle.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Simplicity in strategy creates velocity in execution.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Every single person on your team should know exactly what winning looks like today.",
    "Leila Hormozi",
    "leila"
  ],
  [
    "Don't just build a successful company; build a company that you are genuinely proud of.",
    "Leila Hormozi",
    "leila"
  ]
];
