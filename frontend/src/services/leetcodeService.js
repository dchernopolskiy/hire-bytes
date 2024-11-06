const LEETCODE_API_URL = 'https://leetcode.com/graphql';

const questionQuery = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      likes
      dislikes
      categoryTitle
      topicTags {
        name
        slug
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      stats
      hints
      sampleTestCase
      exampleTestcases
      enableRunCode
    }
  }
`;

const questionListQuery = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total
      questions {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        paidOnly
        status
        title
        titleSlug
        topicTags {
          name
          slug
        }
      }
    }
  }
`;

export const LeetCodeService = {
  async getQuestions({ limit = 50, skip = 0, difficulty = null }) {
    try {
      const response = await fetch(LEETCODE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: questionListQuery,
          variables: {
            categorySlug: "",
            limit,
            skip,
            filters: {
              difficulty: difficulty?.toUpperCase(),
              status: null,
              tags: [],
              searchKeywords: ""
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      return data.data.problemsetQuestionList.questions.filter(q => !q.paidOnly);

    } catch (error) {
      console.error('Error fetching LeetCode questions:', error);
      throw error;
    }
  },

  async getQuestionDetails(titleSlug) {
    try {
      const response = await fetch(LEETCODE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: questionQuery,
          variables: { titleSlug }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }

      const data = await response.json();
      const question = data.data.question;

      // Enhance the question object with useful URLs
      return {
        ...question,
        urls: {
          problem: `https://leetcode.com/problems/${titleSlug}/`,
          discussion: `https://leetcode.com/problems/${titleSlug}/discussion/`,
          solution: `https://leetcode.com/problems/${titleSlug}/solution/`,
          // Add community solutions if available
          communitySolutions: [
            {
              name: 'LeetCode Discussion',
              url: `https://leetcode.com/problems/${titleSlug}/discuss/?currentPage=1&orderBy=most_votes`,
            },
            {
              name: 'GitHub Solutions',
              url: `https://github.com/search?q=${encodeURIComponent(`leetcode ${question.title} solution`)}&type=repositories`,
            }
          ]
        }
      };

    } catch (error) {
      console.error('Error fetching question details:', error);
      throw error;
    }
  },
 
  // Get top-voted community solutions
  async getCommunitySolutions(titleSlug) {
    try {
      const response = await fetch(LEETCODE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query questionTopicsList($questionId: String!, $orderBy: TopicSortingOption, $skip: Int) {
              questionTopicsList(questionId: $questionId, orderBy: $orderBy, skip: $skip) {
                edges {
                  node {
                    id
                    title
                    post {
                      content
                      voteCount
                    }
                  }
                }
              }
            }
          `,
          variables: {
            questionId: titleSlug,
            orderBy: "most_votes",
            skip: 0
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch community solutions');
      }

      const data = await response.json();
      return data.data.questionTopicsList.edges;

    } catch (error) {
      console.error('Error fetching community solutions:', error);
      throw error;
    }
  },

  // Cache the fetched questions to avoid hitting rate limits
  questionCache: new Map(),
  
  async getCachedQuestions(params) {
    const cacheKey = JSON.stringify(params);
    if (this.questionCache.has(cacheKey)) {
      return this.questionCache.get(cacheKey);
    }

    const questions = await this.getQuestions(params);
    this.questionCache.set(cacheKey, questions);
    return questions;
  },

  clearCache() {
    this.questionCache.clear();
  }
};