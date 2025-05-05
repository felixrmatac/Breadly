<script lang="ts">
  import { createRecipe } from '$lib/api';
  import type { Recipe } from '$lib/types';
  import { onMount } from 'svelte';

  // Helper function to round numbers to a specified number of digits
  function round(val: number, digits = 2): number {
    return parseFloat(val.toFixed(digits));
  }

  // Calculates the weight of an ingredient based on its percentage and the flour weight
  function calcWeightFromPercentage(percentage: number, flourWeight: number): number {
    return round((percentage / 100) * flourWeight);
  }

  // Calculates the percentage of an ingredient based on its weight and the flour weight
  function calcPercentageFromWeight(weight: number, flourWeight: number): number {
    return flourWeight === 0 ? 0 : round((weight / flourWeight) * 100);
  }

  // Calculates the sum of percentages of all ingredients
  function getTotalPercentage(): number {
    return recipe.ingredients.reduce((acc, ing) => acc + (ing.percentage || 0), 0);
  }

  // Finds and returns the weight of the ingredient with type 'flour'
  function getFlourWeight(): number {
    return recipe.ingredients.find(i => i.type === 'flour')?.weight || 0;
  }

  // Initial recipe data
  let recipe: Recipe = {
    name: '',
    quantity: 1,
    weightPerUnit: 1000,
    totalWeight: 1000,
    ingredients: [
      { name: 'Flour', type: 'flour', percentage: 100, weight: 0 },
      { name: 'Water', type: 'liquid', percentage: 60, weight: 0 },
      { name: 'Salt', type: 'salt', percentage: 2, weight: 0 },
      { name: 'Leaven', type: 'starter', percentage: 20, weight: 0 }
    ],
    instructions: ''
  };

  // Updates all ingredient weights and total weight based on a given flour weight
  function updateFromFlourWeight(flourWeight: number) {
    const totalPercentage = getTotalPercentage();
    recipe.ingredients.forEach((ing) => {
      ing.weight = calcWeightFromPercentage(ing.percentage, flourWeight);
    });
    // Recalculate total weight based on the new flour weight and total percentage
    recipe.totalWeight = round(flourWeight * (totalPercentage / 100));
    recipe.weightPerUnit = round(recipe.totalWeight / recipe.quantity);
    // Trigger Svelte reactivity by creating a new array instance
    recipe.ingredients = [...recipe.ingredients];
  }

  // Recalculates all ingredient weights and flour weight based on a given total weight
  function recalculateWeightsFromTotalWeight(total: number) {
    const totalPercentage = getTotalPercentage();
     if (totalPercentage === 0) {
        // Handle case where total percentage is zero to avoid division by zero.
        // Set all weights to 0, or perhaps set flour weight to total if total > 0.
        recipe.ingredients.forEach(ing => ing.weight = 0);
        const flourIng = recipe.ingredients.find(i => i.type === 'flour');
        if (flourIng && total > 0) {
            flourIng.weight = round(total);
        }
        recipe.totalWeight = round(total);
        recipe.weightPerUnit = round(total / recipe.quantity);
        recipe.ingredients = [...recipe.ingredients]; // Trigger reactivity
        return;
    }

    // Calculate the implied flour weight based on the total weight and total percentage
    const flourWeight = total / (totalPercentage / 100);

    // Update all ingredient weights based on the calculated flour weight
    recipe.ingredients.forEach((ing) => {
      ing.weight = calcWeightFromPercentage(ing.percentage, flourWeight);
    });

    // Update recipe total weight and weight per unit
    recipe.totalWeight = round(total);
    recipe.weightPerUnit = round(total / recipe.quantity);
    // Trigger Svelte reactivity
    recipe.ingredients = [...recipe.ingredients];
  }

  // Updates total weight and recalculates ingredient weights when quantity or weight per unit changes
  function updateFromQuantityOrUnit() {
    recipe.totalWeight = round(recipe.quantity * recipe.weightPerUnit);
    recalculateWeightsFromTotalWeight(recipe.totalWeight);
  }

  // Adds a new ingredient to the recipe
  function addIngredient() {
    recipe.ingredients = [...recipe.ingredients, { name: '', type: '', percentage: 0, weight: 0 }];
    // Recalculate weights based on the current total weight to update the new ingredient's weight
    recalculateWeightsFromTotalWeight(recipe.totalWeight);
  }

  // Removes an ingredient from the recipe by index
  function removeIngredient(index: number) {
    recipe.ingredients = recipe.ingredients.filter((_, i) => i !== index);
    // Recalculate weights based on the current total weight to update weights after removal
    recalculateWeightsFromTotalWeight(recipe.totalWeight);
  }

  // Handles changes to an ingredient's weight input
  function handleIngredientWeightChange(index: number) {
    const ing = recipe.ingredients[index];
    const originalPercentage = ing.percentage; // Store original percentage before updating weight
    ing.weight = round(ing.weight); // Round the input weight

    if (ing.type === 'flour') {
      // If the changed ingredient is flour, recalculate all weights and total based on the new flour weight
      updateFromFlourWeight(ing.weight);
    } else {
      // If a non-flour ingredient weight changes:
      const currentFlourWeight = getFlourWeight();

      if (originalPercentage > 0) {
         // Calculate the implied NEW flour weight based on the ingredient's NEW weight and its ORIGINAL percentage
         const impliedNewFlourWeight = ing.weight / (originalPercentage / 100);

         if (impliedNewFlourWeight > 0 && isFinite(impliedNewFlourWeight)) {
            // If a valid implied flour weight is calculated, update the entire recipe based on it.
            // This will set the flour weight and scale all other ingredients based on their original percentages.
            updateFromFlourWeight(impliedNewFlourWeight);
         } else {
            // If implied flour weight is not valid (e.g., new weight is 0 or original percentage was tiny causing huge implied flour weight),
            // revert the weight change or show a warning. Reverting based on original percentage and current flour weight seems reasonable.
            if (currentFlourWeight > 0) {
                 ing.weight = calcWeightFromPercentage(originalPercentage, currentFlourWeight); // Revert weight
                 // Recalculate total based on reverted weight
                 const newTotalWeight = recipe.ingredients.reduce((acc, currentIng) => acc + currentIng.weight, 0);
                 recipe.totalWeight = round(newTotalWeight);
                 recipe.weightPerUnit = round(recipe.totalWeight / recipe.quantity);
                 recipe.ingredients = [...recipe.ingredients]; // Trigger reactivity
                 console.warn(`Invalid weight entered for ${ing.name}. Reverted to weight based on its original percentage (${originalPercentage}%) and current flour weight (${currentFlourWeight}g).`);
             } else {
                 // If no flour weight, just update the weight and total based on sum, warn the user.
                 const newTotalWeight = recipe.ingredients.reduce((acc, currentIng) => acc + currentIng.weight, 0);
                 recipe.totalWeight = round(newTotalWeight);
                 recipe.weightPerUnit = round(recipe.totalWeight / recipe.quantity);
                 recipe.ingredients = [...recipe.ingredients]; // Trigger reactivity
                 console.warn(`Could not calculate implied flour weight for ${ing.name}. No flour ingredient found or flour weight is zero.`);
             }
         }
      } else {
         // If the original percentage was 0, we cannot infer a flour weight from this ingredient's weight change.
         // Just update the weight of the changed ingredient.
         // Recalculate the total weight based on the sum of current weights.
         const newTotalWeight = recipe.ingredients.reduce((acc, currentIng) => acc + currentIng.weight, 0);
         recipe.totalWeight = round(newTotalWeight);
         recipe.weightPerUnit = round(recipe.totalWeight / recipe.quantity);
         // Trigger reactivity for the changed ingredient's weight and the total
         recipe.ingredients = [...recipe.ingredients];
         console.warn(`Ingredient ${ing.name} has 0% percentage. Cannot scale recipe based on its weight change. Only its weight and the total were updated.`);
      }
      // After potential scaling (or if no scaling happened), update the displayed percentage
      // of the changed ingredient based on its FINAL weight and the FINAL flour weight.
      const finalFlourWeight = getFlourWeight();
      if (finalFlourWeight > 0) {
          ing.percentage = calcPercentageFromWeight(ing.weight, finalFlourWeight);
      } else {
          ing.percentage = 0;
      }
      recipe.ingredients = [...recipe.ingredients]; // Ensure final percentage update is reactive
    }
  }


  // Handles changes to an ingredient's percentage input
  function handleIngredientPercentageChange(index: number) {
    const ing = recipe.ingredients[index];
    ing.percentage = round(ing.percentage); // Round the input percentage

    const flourWeight = getFlourWeight();
    if (!flourWeight) {
         console.warn("Cannot calculate weight from percentage: No flour ingredient found or flour weight is zero.");
         ing.weight = 0; // Set weight to 0 if flour weight is unavailable
         recipe.ingredients = [...recipe.ingredients]; // Trigger reactivity for the changed percentage
         return;
    }

    // Calculate the weight of the ingredient based on the new percentage and flour weight
    ing.weight = calcWeightFromPercentage(ing.percentage, flourWeight);

    // After changing percentage and updating weight, recalculate the total weight
    const newTotalWeight = recipe.ingredients.reduce((acc, currentIng) => acc + currentIng.weight, 0);
    recipe.totalWeight = round(newTotalWeight);
    recipe.weightPerUnit = round(recipe.totalWeight / recipe.quantity);

    // Trigger Svelte reactivity for the ingredients array and total properties
    recipe.ingredients = [...recipe.ingredients];
     // No need to call updateFromFlourWeight here, as changing a percentage
     // only directly affects the weight of that ingredient relative to flour,
     // and we've already updated the total based on the new sum of weights.
  }

  // On component mount, perform an initial calculation based on the default total weight
  onMount(() => {
    recalculateWeightsFromTotalWeight(recipe.totalWeight);
  });
</script>

<div class="mx-auto mt-10 max-w-xl">
  <h1 class="mb-4 text-2xl font-bold">Create a New Recipe</h1>
  <form class="space-y-4" on:submit|preventDefault={() => createRecipe(recipe)}>
    <div>
      <label class="block text-sm font-medium text-gray-700">Recipe Name</label>
      <input type="text" bind:value={recipe.name} class="mt-1 block w-full rounded-md border border-gray-300 p-2" />
    </div>

    <div class="flex gap-4">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700">Quantity</label>
        <input type="number" min="1" bind:value={recipe.quantity} on:input={updateFromQuantityOrUnit} class="mt-1 block w-full rounded-md border border-gray-300 p-2" />
      </div>

      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700">Weight per unit</label>
        <div class="relative">
          <input
            type="number"
            step="any"
            min="1"
            bind:value={recipe.weightPerUnit}
            on:input={updateFromQuantityOrUnit}
            on:blur={() => recipe.weightPerUnit = round(recipe.weightPerUnit)}
            class="no-spinner mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 text-right text-sm"
          />
          <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">g</span>
        </div>
      </div>

      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700">Total Weight</label>
        <div class="relative">
          <input
            type="number"
            step="any"
            bind:value={recipe.totalWeight}
            on:input={() => recalculateWeightsFromTotalWeight(recipe.totalWeight)}
            on:blur={() => recipe.totalWeight = round(recipe.totalWeight)}
            class="no-spinner mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 text-right text-sm"
          />
          <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">g</span>
        </div>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Ingredients</label>
      <button type="button" on:click={addIngredient} class="mt-2 text-sm text-blue-600">+ Add Ingredient</button>

      {#each recipe.ingredients as ing, i}
        <div class="mt-2 grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
          <input type="text" bind:value={ing.name} placeholder="Name" class="col-span-1 rounded border p-2 text-sm placeholder-black" />

          <select bind:value={ing.type} class="col-span-1 rounded border p-2 text-sm" required>
            <option value="" disabled hidden>Category</option>
            <option value="flour">Flour</option>
            <option value="liquid">Liquid</option>
            <option value="salt">Salt</option>
            <option value="yeast">Yeast</option>
            <option value="sweetener">Sweetener</option>
            <option value="fat">Fat</option>
            <option value="spice">Spice</option>
            <option value="grain">Grain</option>
            <option value="starter">Starter</option>
            <option value="add-in">Add-in</option>
          </select>

          <div class="relative">
            <input
              type="number"
              step="any"
              bind:value={ing.percentage}
              class="no-spinner w-full rounded border p-2 pr-10 text-right text-sm"
              on:blur={() => handleIngredientPercentageChange(i)}
            />
            <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>

          <div class="relative">
            <input
              type="number"
              step="any"
              bind:value={ing.weight}
              class="no-spinner w-full rounded border p-2 pr-10 text-right text-sm"
              on:blur={() => handleIngredientWeightChange(i)}
            />
            <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">g</span>
          </div>

          {#if i < 4}
            <span class="invisible w-full text-lg">&times;</span>
          {:else}
            <button
              type="button"
              class="text-lg font-bold text-red-500 hover:text-red-700"
              title="Remove"
              on:click={() => removeIngredient(i)}
            >
              &times;
            </button>
          {/if}
        </div>
      {/each}
      <p class="mt-2 text-right text-sm text-gray-600">
        Total: {getTotalPercentage().toFixed(2)}%
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Instructions</label>
      <textarea bind:value={recipe.instructions} class="mt-1 block w-full rounded-md border border-gray-300 p-2"></textarea>
    </div>

    <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
      Save Recipe
    </button>
  </form>
</div>

<style>
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
</style>
