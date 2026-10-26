"use client";

import { useTranslations } from "next-intl";

import { BrandForm } from "./brand-form.component";
import { CategoryForm } from "./category-form.component";
import { EditorPanel } from "./editor-panel.component";
import { FormAlert } from "./form-fields.component";
import { ProductForm } from "./product-form.component";
import { VariantsSection } from "./variants-section.component";
import { useCatalogEditor } from "../../hooks/manager/use-catalog-editor.hook";
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
  const editor = useCatalogEditor({
    isDirty: manager.isDirty,
    markClean: manager.markClean,
    onSaved: manager.saved,
    savedMessage: translate("actions.saved"),
  });

  if (manager.showsBrands) {
    return (
      <EditorPanel
        title={translate(isCreating ? "brandForm.createTitle" : "brandForm.editTitle")}
        onClose={manager.closeEditor}
        onCloseAutoFocus={manager.restoreFocus}
      >
        <div onChange={manager.markDirty}>
          <BrandForm key={manager.editingId} brand={editingBrand} onSaved={editor.saved} />
        </div>
      </EditorPanel>
    );
  }

  if (manager.showsCategories) {
    return (
      <EditorPanel
        title={translate(isCreating ? "categoryForm.createTitle" : "categoryForm.editTitle")}
        onClose={manager.closeEditor}
        onCloseAutoFocus={manager.restoreFocus}
      >
        <div onChange={manager.markDirty}>
          <CategoryForm key={manager.editingId} category={editingCategory} onSaved={editor.saved} />
        </div>
      </EditorPanel>
    );
  }

  return (
    <EditorPanel
      title={translate(isCreating ? "productForm.createTitle" : "productForm.editTitle")}
      onClose={manager.closeEditor}
      onCloseAutoFocus={manager.restoreFocus}
    >
      <div onChange={manager.markDirty}>
        <fieldset
          disabled={editor.isPresentationOpen || manager.ordering.isPending}
          className="min-w-0"
        >
          <ProductForm
            key={editingProduct?.id ?? manager.editingId}
            product={editingProduct}
            brands={manager.allBrands}
            categories={manager.allCategories}
            defaultBrandId={manager.newProductBrandId}
            variants={manager.editingVariants}
            onSaved={editor.saved}
          />
        </fieldset>
        {editor.needsSave && <FormAlert message={translate("variants.saveFirst")} />}
        {editingProduct && (
          <VariantsSection
            productId={editingProduct.id}
            variants={manager.editingVariants}
            beforeEdit={editor.beforePresentationEdit}
            isDirty={manager.isDirty}
            onEditingChange={editor.setIsPresentationOpen}
            onSaved={editor.presentationSaved}
            onDiscard={manager.markClean}
            ordering={manager.ordering}
          />
        )}
      </div>
    </EditorPanel>
  );
}
