"use client";

import { useTranslations } from "next-intl";

import { BrandForm } from "./brand-form.component";
import { CategoryForm } from "./category-form.component";
import { EditorPanel } from "./editor-panel.component";
import { FormAlert } from "./form-fields.component";
import { ProductForm } from "./product-form.component";
import { VariantsSection } from "./variants-section.component";
import { EditorForm } from "../../hooks/manager/catalog-editor.constants";
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
    isRecordDirty: manager.isFormDirty(EditorForm.Record),
    onSaved: manager.saved,
    savedMessage: translate("actions.saved"),
  });
  const recordDirtyChanged = (isDirty: boolean) => manager.reportDirty(EditorForm.Record, isDirty);

  if (manager.showsBrands) {
    return (
      <EditorPanel
        title={translate(isCreating ? "brandForm.createTitle" : "brandForm.editTitle")}
        onClose={manager.closeEditor}
        onCloseAutoFocus={manager.restoreFocus}
      >
        <BrandForm
          key={manager.editingId}
          brand={editingBrand}
          onSaved={editor.saved}
          onDirtyChange={recordDirtyChanged}
        />
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
        <CategoryForm
          key={manager.editingId}
          category={editingCategory}
          onSaved={editor.saved}
          onDirtyChange={recordDirtyChanged}
        />
      </EditorPanel>
    );
  }

  return (
    <EditorPanel
      title={translate(isCreating ? "productForm.createTitle" : "productForm.editTitle")}
      onClose={manager.closeEditor}
      onCloseAutoFocus={manager.restoreFocus}
    >
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
          onDirtyChange={recordDirtyChanged}
        />
      </fieldset>
      {editor.needsSave && <FormAlert message={translate("variants.saveFirst")} />}
      {editingProduct && (
        <VariantsSection
          productId={editingProduct.id}
          variants={manager.editingVariants}
          beforeEdit={editor.beforePresentationEdit}
          onEditingChange={editor.setIsPresentationOpen}
          onSaved={editor.presentationSaved}
          onDirtyChange={(isDirty) => manager.reportDirty(EditorForm.Presentation, isDirty)}
          ordering={manager.ordering}
        />
      )}
    </EditorPanel>
  );
}
