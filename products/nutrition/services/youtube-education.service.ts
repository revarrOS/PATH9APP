import { getConditionNutritionKnowledge } from '../knowledge/condition-nutrition-map';

export type YouTubeEducationVideo = {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
};

export type YouTubeSearchResult = {
  videos: YouTubeEducationVideo[];
  searchQuery: string;
  timestamp: string;
};

const APPROVED_CHANNEL_KEYWORDS = [
  'registered dietitian',
  'RD',
  'RDN',
  'cancer center',
  'medical center',
  'university hospital',
  'oncology',
  'leukemia lymphoma society',
];

const BANNED_KEYWORDS = [
  'cure cancer',
  'miracle food',
  'superfood',
  'detox',
  'cleanse',
  'guaranteed',
  'secret',
  'alternative medicine',
];

export const youtubeEducationService = {
  async searchEducationalVideos(
    diagnosis: string | null,
    topic?: string
  ): Promise<YouTubeSearchResult | null> {
    const knowledge = getConditionNutritionKnowledge(diagnosis);

    const searchTerms = topic
      ? [`${diagnosis} nutrition ${topic} registered dietitian`]
      : knowledge.searchTerms.slice(0, 1);

    const searchQuery = searchTerms[0];

    return {
      videos: [],
      searchQuery,
      timestamp: new Date().toISOString(),
    };
  },

  isVideoApproved(video: YouTubeEducationVideo): {
    approved: boolean;
    reason?: string;
  } {
    const lowerTitle = video.title.toLowerCase();
    const lowerDescription = video.description.toLowerCase();
    const lowerChannel = video.channelTitle.toLowerCase();

    for (const banned of BANNED_KEYWORDS) {
      if (lowerTitle.includes(banned) || lowerDescription.includes(banned)) {
        return {
          approved: false,
          reason: `Contains banned keyword: ${banned}`,
        };
      }
    }

    const hasApprovedChannel = APPROVED_CHANNEL_KEYWORDS.some(
      keyword =>
        lowerChannel.includes(keyword) ||
        lowerTitle.includes(keyword) ||
        lowerDescription.includes(keyword)
    );

    if (!hasApprovedChannel) {
      return {
        approved: false,
        reason: 'Not from an approved channel type',
      };
    }

    return { approved: true };
  },

  buildEducationalContext(diagnosis: string | null): string {
    const knowledge = getConditionNutritionKnowledge(diagnosis);

    const context = `
Educational Topics Available:
${knowledge.educationTopics.map(topic => `- ${topic}`).join('\n')}

Support Areas to Explore:
${knowledge.supportAreas.map(area => `- ${area.label}: ${area.indicativeStatement}`).join('\n')}

Search Terms for Finding Videos:
${knowledge.searchTerms.map(term => `- ${term}`).join('\n')}

IMPORTANT REMINDERS FOR GEMMA:
- YouTube education is passive and weekly only
- Videos must be from registered dietitians or medical institutions
- Never auto-recommend videos without human approval
- Suggest topics the user can explore, don't provide direct links
- Frame as "you might find it helpful to search for X" not "watch this video"
`;

    return context;
  },

  formatEducationalSuggestion(topic: string, diagnosis: string | null): string {
    const knowledge = getConditionNutritionKnowledge(diagnosis);
    const relevantTopic = knowledge.educationTopics.find(t => t.includes(topic));

    if (relevantTopic) {
      return `You might find it helpful to explore educational content about "${relevantTopic}" from registered dietitians or cancer centers. These resources often provide evidence-based guidance.`;
    }

    return `Educational content from registered dietitians or medical institutions can provide helpful context about nutrition during treatment.`;
  },
};
