export default function About() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <section className="bg-gradient-to-br from-[#FE6972] to-[#d44a54] text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3" style={{fontFamily:"'Playfair Display',serif"}}>About Rose Bazaar</h1>
          <p className="opacity-80 max-w-2xl mx-auto">Egypt's premier wedding marketplace connecting couples with the best wedding vendors.</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-gray-600 leading-relaxed">Rose Bazaar is the leading wedding marketplace in Egypt, helping thousands of couples plan their perfect wedding. We connect you with verified, top-rated vendors across every category.</p>
      </div>
    </div>
  );
}
