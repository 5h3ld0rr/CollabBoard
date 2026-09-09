import * as searchService from '../services/searchService.js';

export async function search(req, res) {
  const results = await searchService.searchAll(req.user.id, req.query);
  res.status(200).json({
    data: results,
  });
}
