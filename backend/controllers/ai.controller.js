import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) {
      return res.status(400).send({ message: 'Missing prompt parameter' });
    }

    const result = await ai.generateResult(prompt);
    res.send({ data: result });
  } catch (error) {
    console.error('Error in getResult:', error);
    res.status(500).send({ message: error.message });
  }
};
