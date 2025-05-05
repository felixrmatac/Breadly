import type { Recipe } from './types';

const API = 'http://localhost:3000/recipes';

export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(API);
  return res.json();
}

export async function getRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${API}/${id}`);
  return res.json();
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe)
  });
  return res.json();
}

export async function updateRecipe(id: string, recipe: Recipe): Promise<Recipe> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe)
  });
  return res.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
}