"use client";

import { useTranslations } from "next-intl";

import { BrandForm } from "./brand-form.component";
import { CategoryForm } from "./category-form.component";
import { EditorPanel } from "./editor-panel.component";
import { ProductForm } from "./product-form.component";
import { VariantsSection } from "./variants-section.component";
import type { useCatalogManager } from "../../hooks/manager/use-catalog-manager.hook";

/**
 * Props for the editor.
 */
type CatalogEditorProps = {
  manager: ReturnType<typeof useCatalogManager>;
};

/**
 * The open section's form for the record being edited or created; products also list variants.
 * @param props The manager's state.
 * @returns The editor panel.
 */
export function CatalogEditor({ manager }: CatalogEditorProps) {
  const translate = useTranslations("catalog.manager");
  const { isCreating, editingProduct, editingBrand, editingCategory } = manager;

  if (manager.showsBrands) {
    return (
      <EditorPanel
        title={translate(isCreating ? "brandForm.createTitle" : "brandForm.editTitle")}
        onClose={manager.closeEditor}
      >
        <BrandForm key={manager.editingId} brand={editingBrand} onSaved={manager.closeEditor} />
      </EditorPanel>
    );
  }

  if (manager.showsCategories) {
    return (
      <EditorPanel
        title={translate(isCreating ? "categoryForm.createTitle" : "categoryForm.editTitle")}
        onClose={manager.closeEditor}
      >
        <CategoryForm
          key={manager.editingId}
          category={editingCategory}
          onSaved={manager.closeEditor}
        />
      </EditorPanel>
    );
  }

  return (
    <EditorPanel
      title={translate(isCreating ? "productForm.createTitle" : "productForm.editTitle")}
      onClose={manager.closeEditor}
    >
      <ProductForm
        key={editingProduct?.id ?? manager.editingId}
        product={editingProduct}
        brands={manager.allBrands}
        categories={manager.allCategories}
        defaultBrandId={manager.newProductBrandId}
        onSaved={(product) => manager.edit(product.id)}
      />
      {editingProduct && (
        <VariantsSection productId={editingProduct.id} variants={manager.editingVariants} />
      )}
    </EditorPanel>
  );
}
