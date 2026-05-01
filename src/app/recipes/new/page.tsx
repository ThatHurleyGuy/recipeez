import RecipeEditor from "@/app/components/RecipeEditor";

export default function NewRecipePage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Add Recipe</h1>
          <p className="lede">Create manually or import from a recipe page.</p>
        </div>
      </div>
      <RecipeEditor />
    </>
  );
}
