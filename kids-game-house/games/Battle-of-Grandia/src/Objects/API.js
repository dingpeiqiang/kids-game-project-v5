import 'regenerator-runtime';

const API = (() => {
  async function getScores() {
    try {
      const scores = await fetch(
        'https://us-central1-js-capstone-backend.cloudfunctions.net/api/games/awrtkiMDOOhi5bAP1ojY/scores',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return scores.json();
    } catch (error) {
      console.error('Error fetching scores:', error);
      return { result: [] };
    }
  }

  async function postScores(name, score) {
    try {
      const result = await fetch(
        'https://us-central1-js-capstone-backend.cloudfunctions.net/api/games/awrtkiMDOOhi5bAP1ojY/scores',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: name,
            score,
          }),
        },
      );

      return result.json();
    } catch (error) {
      console.error('Error posting score:', error);
      return { result: 'Error' };
    }
  }

  return { getScores, postScores };
})();

export default API;
