import ProductGallery from "../../components/ProductGallery";

export default function ProductosPage() {
  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-[#A084CA] mb-6 text-center">Nuestros Productos</h1>
      <ProductGallery />
    </div>
  );
}