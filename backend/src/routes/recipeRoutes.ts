import express from 'express';
import Recipe from '../models/Recipe';

const router = express.Router();

// GET /recipes - Get all recipes
router.get('/', async (req, res) => {
	try {
		const recipes = await Recipe.find();
		res.json(recipes);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch recipes' });
	}
});

// GET /recipes/:id - Get one recipe by ID
router.get('/:id', async (req, res) => {
	try {
		const recipe = await Recipe.findById(req.params.id);
		if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
		res.json(recipe);
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch recipe' });
	}
});

// POST /recipes - Create a new recipe
router.post('/', async (req, res) => {
	try {
		const { name, ingredients, instructions, quantity, weightPerUnit, totalWeight } = req.body;

		if (!name || !ingredients || !quantity || !weightPerUnit || !totalWeight) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const newRecipe = new Recipe({
			name,
			ingredients,
			instructions,
			quantity,
			weightPerUnit,
			totalWeight
		});

		const saved = await newRecipe.save();
		res.status(201).json(saved);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to create recipe' });
	}
});

// PUT /recipes/:id - Update a recipe
router.put('/:id', async (req, res) => {
	try {
		const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!updated) return res.status(404).json({ error: 'Recipe not found' });
		res.json(updated);
	} catch (err) {
		res.status(500).json({ error: 'Failed to update recipe' });
	}
});

// DELETE /recipes/:id - Delete a recipe
router.delete('/:id', async (req, res) => {
	try {
		const deleted = await Recipe.findByIdAndDelete(req.params.id);
		if (!deleted) return res.status(404).json({ error: 'Recipe not found' });
		res.json({ message: 'Recipe deleted' });
	} catch (err) {
		res.status(500).json({ error: 'Failed to delete recipe' });
	}
});

export default router;
