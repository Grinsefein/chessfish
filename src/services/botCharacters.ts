import { BotProfile } from '@/types/chess';

export interface BotPersonality {
  id: string;
  name: string;
  elo: number;
  description: string;
  backstory: string;
  avatar: {
    color: string;
    gradient: string;
    icon: string;
  };
  playStyle: {
    aggression: number; // 0-100
    tactical: number; // 0-100
    positional: number; // 0-100
    openings: string[];
    preferredOpenings: string[];
  };
  traits: string[];
  quotes: {
    win: string[];
    loss: string[];
    draw: string[];
    move: string[];
  };
  difficultyModifiers: {
    earlyGame: number; // -5 to +5
    midGame: number;
    endGame: number;
  };
}

export const BOT_PERSONALITIES: BotPersonality[] = [
  {
    id: 'beginner-bob',
    name: 'Beginner Bob',
    elo: 400,
    description: 'Just learning the ropes, makes basic mistakes',
    backstory: 'Bob discovered chess last month and is still learning how the pieces move. He enjoys the game but often hangs pieces and misses simple tactics.',
    avatar: {
      color: '#22c55e',
      gradient: 'from-green-400 to-green-600',
      icon: '🌱'
    },
    playStyle: {
      aggression: 30,
      tactical: 20,
      positional: 25,
      openings: ['Italian Game', 'Four Knights'],
      preferredOpenings: ['1.e4 e5 2.Nf3 Nc6 3.Bc4']
    },
    traits: ['Friendly', 'Eager to learn', 'Makes blunders'],
    quotes: {
      win: ['Wow, I won! Beginner\'s luck?', 'Thanks for the game! I\'m learning so much!'],
      loss: ['Good game! I need to practice more.', 'That was tricky! Let me analyze this later.'],
      draw: ['A draw? I\'ll take it!', 'We\'re evenly matched!'],
      move: ['Hmm, let me think...', 'Is this a good move?']
    },
    difficultyModifiers: { earlyGame: -2, midGame: -3, endGame: -2 }
  },
  {
    id: 'tactical-terry',
    name: 'Tactical Terry',
    elo: 800,
    description: 'Loves tactics and combinations, but weak positionally',
    backstory: 'Terry spends hours solving chess puzzles on Lichess. He can spot a fork from a mile away but sometimes neglects his king safety in pursuit of glory.',
    avatar: {
      color: '#f59e0b',
      gradient: 'from-amber-400 to-orange-500',
      icon: '⚡'
    },
    playStyle: {
      aggression: 85,
      tactical: 80,
      positional: 30,
      openings: ['Sicilian Defense', 'King\'s Gambit'],
      preferredOpenings: ['1.e4 c5', '1.e4 e5 2.f4']
    },
    traits: ['Aggressive', 'Tactical genius', 'Risk-taker'],
    quotes: {
      win: ['Checkmate! Did you see that coming?', 'Tactics always prevail!'],
      loss: ['I went for the attack but missed your defense...', 'Next time I\'ll calculate deeper!'],
      draw: ['A fighting draw! Both sides had chances.'],
      move: ['There\'s a tactic here...', 'Let\'s complicate things!']
    },
    difficultyModifiers: { earlyGame: 0, midGame: 2, endGame: -1 }
  },
  {
    id: 'positional-pam',
    name: 'Positional Pam',
    elo: 1200,
    description: 'Solid positional player, builds up advantages slowly',
    backstory: 'Pam believes in the timeless principles of chess. She dominates the center, improves her pieces systematically, and converts advantages with clinical precision.',
    avatar: {
      color: '#3b82f6',
      gradient: 'from-blue-400 to-blue-600',
      icon: '🏛️'
    },
    playStyle: {
      aggression: 40,
      tactical: 50,
      positional: 85,
      openings: ['Queen\'s Gambit', 'English Opening'],
      preferredOpenings: ['1.d4 d5 2.c4', '1.c4']
    },
    traits: ['Strategic', 'Patient', 'Solid'],
    quotes: {
      win: ['Positionally dominated from the start.', 'Good technique triumphs!'],
      loss: ['You outplayed me positionally. Well done.', 'My structure collapsed...'],
      draw: ['A solid draw. No weaknesses in either position.'],
      move: ['Improving the position...', 'Let\'s build a strong center.']
    },
    difficultyModifiers: { earlyGame: 1, midGame: 1, endGame: 1 }
  },
  {
    id: 'endgame-evelyn',
    name: 'Endgame Evelyn',
    elo: 1500,
    description: 'Mediocre in openings but transforms in the endgame',
    backstory: 'Evelyn has studied Dvoretsky\'s Endgame Manual cover to cover. She might lose the opening battle, but if you let her reach an endgame, you\'re in trouble.',
    avatar: {
      color: '#8b5cf6',
      gradient: 'from-violet-400 to-purple-600',
      icon: '👑'
    },
    playStyle: {
      aggression: 50,
      tactical: 65,
      positional: 70,
      openings: ['Caro-Kann', 'Petrov Defense'],
      preferredOpenings: ['1.e4 c6', '1.e4 e5 2.Nf3 Nf6']
    },
    traits: ['Endgame specialist', 'Resilient', 'Technical'],
    quotes: {
      win: ['The endgame is my domain!', 'Converted the advantage perfectly.'],
      loss: ['I never reached my endgame...', 'Need to survive the middlegame better.'],
      draw: ['A theoretical draw in the endgame.'],
      move: ['Thinking about the endgame already...', 'Simplifying to a winning ending.']
    },
    difficultyModifiers: { earlyGame: -1, midGame: 0, endGame: 4 }
  },
  {
    id: 'aggressive-alex',
    name: 'Aggressive Alex',
    elo: 1800,
    description: 'Attacks at all costs, creates chaos on the board',
    backstory: 'Alex believes fortune favors the bold. Every game is a battle, and Alex plays for the win from move one. Kings beware - safety is secondary to victory!',
    avatar: {
      color: '#ef4444',
      gradient: 'from-red-400 to-red-600',
      icon: '🔥'
    },
    playStyle: {
      aggression: 95,
      tactical: 90,
      positional: 40,
      openings: ['King\'s Gambit', 'Danish Gambit', 'Grand Prix Attack'],
      preferredOpenings: ['1.e4 e5 2.f4', '1.e4 e5 2.d4 exd4 3.c3']
    },
    traits: ['Fearless', 'Attacking player', 'Charismatic'],
    quotes: {
      win: ['That\'s how you attack!', 'The king hunt was beautiful!'],
      loss: ['I died with my boots on!', 'Attacking chess carries risks...'],
      draw: ['A truce? I was just getting started!'],
      move: ['Attack! Attack! Attack!', 'Your king is mine!', 'No time for defense!']
    },
    difficultyModifiers: { earlyGame: 3, midGame: 3, endGame: -2 }
  },
  {
    id: 'grandmaster-gary',
    name: 'GM Gary',
    elo: 2500,
    description: 'Former Grandmaster, plays flawless chess',
    backstory: 'Gary was a top 100 player in the 1990s. Though retired from professional play, his understanding of chess remains elite. He sees moves 20 ply deep and plays with perfect technique.',
    avatar: {
      color: '#fbbf24',
      gradient: 'from-yellow-400 to-amber-600',
      icon: '👔'
    },
    playStyle: {
      aggression: 70,
      tactical: 95,
      positional: 95,
      openings: ['Najdorf Sicilian', 'Ruy Lopez', 'Nimzo-Indian'],
      preferredOpenings: ['1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6']
    },
    traits: ['Elite', 'Perfect technique', 'Deep calculation'],
    quotes: {
      win: ['Good effort, but precision matters at this level.', 'I\'ve seen this pattern a thousand times.'],
      loss: ['Remarkable! You\'ve found resources I missed.', 'A worthy opponent!'],
      draw: ['A well-played game. Both sides found the best moves.'],
      move: ['The position demands exact play.', 'Calculating the consequences...']
    },
    difficultyModifiers: { earlyGame: 5, midGame: 5, endGame: 5 }
  }
];

// Get bot personality by ID
export function getBotPersonality(botId: string): BotPersonality | undefined {
  return BOT_PERSONALITIES.find(b => b.id === botId);
}

// Get bot personality by ELO range
export function getBotByElo(elo: number): BotPersonality {
  const sorted = [...BOT_PERSONALITIES].sort((a, b) => a.elo - b.elo);
  
  for (const bot of sorted) {
    if (bot.elo >= elo) return bot;
  }
  
  return sorted[sorted.length - 1];
}

// Get opening recommendation for bot
export function getBotOpening(bot: BotPersonality): string {
  const openings = bot.playStyle.preferredOpenings;
  return openings[Math.floor(Math.random() * openings.length)] || '1.e4';
}

// Calculate dynamic difficulty based on player performance
export interface PerformanceHistory {
  wins: number;
  losses: number;
  draws: number;
  averageAccuracy: number;
}

export function calculateDynamicElo(
  baseElo: number,
  performance: PerformanceHistory
): number {
  const totalGames = performance.wins + performance.losses + performance.draws;
  if (totalGames < 3) return baseElo;

  const winRate = performance.wins / totalGames;
  
  // Adjust based on performance
  let adjustment = 0;
  
  if (winRate > 0.7) {
    // Player is winning too much - increase difficulty
    adjustment = Math.min(200, (winRate - 0.5) * 500);
  } else if (winRate < 0.3) {
    // Player is losing too much - decrease difficulty
    adjustment = Math.max(-200, (winRate - 0.5) * 500);
  }

  // Also consider accuracy
  if (performance.averageAccuracy > 80) {
    adjustment += 50;
  } else if (performance.averageAccuracy < 50) {
    adjustment -= 50;
  }

  return Math.max(200, Math.min(2800, baseElo + adjustment));
}

// Get bot quote for situation
export function getBotQuote(
  bot: BotPersonality,
  situation: 'win' | 'loss' | 'draw' | 'move'
): string {
  const quotes = bot.quotes[situation];
  return quotes[Math.floor(Math.random() * quotes.length)] || '';
}

// Convert personality to legacy Bot format
export function personalityToBot(personality: BotPersonality): BotProfile {
  return {
    id: personality.id,
    name: personality.name,
    skillLevel: Math.round(personality.elo / 250),
    elo: personality.elo,
    description: personality.description,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${personality.id}`,
    thinkTime: Math.max(500, 2000 - personality.elo / 2)
  };
}
