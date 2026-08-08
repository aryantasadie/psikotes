import os
import sys

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

# Grab the examples dictionary from our existing script
sys.path.append(r"d:\Kuliah\Kerja\psikotes\psikotes-app\scripts")
from inject_examples_v2 import examples

def generate_component(name, test_type, title, is_multi, content_is_img, options_is_img, instruction_html):
    multi_state = "const [answers, setAnswers] = useState<Record<number, string[]>>({});" if is_multi else "const [answers, setAnswers] = useState<Record<number, string>>({});"
    
    multi_handler = """
  const handleAnswer = (val: string) => {
    const current = answers[q.id] || [];
    if (current.includes(val)) {
      setAnswers({ ...answers, [q.id]: current.filter(x => x !== val) });
    } else {
      if (current.length < 2) {
        setAnswers({ ...answers, [q.id]: [...current, val] });
      }
    }
  };
""" if is_multi else """
  const handleAnswer = (val: string) => setAnswers({ ...answers, [questions[currentIndex].id]: val });
"""

    if name == "IST7":
        # Special layout for IST 7
        content_render = """
        {/* Konten Soal */}
        <div style={{ marginBottom: '30px', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            {q.content.startsWith('/soal/') ? (
              <>
                <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Potongan Gambar (Soal):</h4>
                <img src={q.content} alt="Soal" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </>
            ) : (
              <h3 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px' }}>{q.content}</h3>
            )}
          </div>
        </div>

        {/* Area Referensi */}
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '30px' }}>
          <h4 style={{ color: '#555', marginBottom: '10px' }}>Pilihan Bentuk Utuh (A, B, C, D, E):</h4>
          <img 
            src={currentIndex < 12 ? `/soal/ist7/referensi.jpeg` : `/soal/ist7/referensi2.jpeg`} 
            alt="Referensi" 
            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '8px' }} 
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>
"""
    elif name == "WPT":
        content_render = """
        {/* Konten Soal */}
        <div style={{ marginBottom: '30px', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            {q.content.includes('|||') ? (
              <>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{q.content.split('|||')[0]}</h3>
                <img src={q.content.split('|||')[1]} alt="Soal" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '15px' }} />
              </>
            ) : (
              <h3 style={{ margin: 0, fontSize: '24px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{q.content}</h3>
            )}
          </div>
        </div>
"""
    else:
        content_render = """
        <div style={{ marginBottom: '40px', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
""" + (
"""          <img src={q.content} alt="Soal" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', border: '1px solid #ddd', objectFit: 'contain' }} />""" if content_is_img else """          <h3 style={{ fontSize: '24px', textAlign: 'center', lineHeight: '1.5', margin: 0, color: '#333' }}>{q.content}</h3>"""
) + """
        </div>
"""

    options_render = ""
    if options_is_img:
        options_render = """
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = """ + ("answers[q.id]?.includes(opt)" if is_multi else "answers[q.id] === opt") + """;
            return (
              <div 
                key={idx}
                onClick={() => handleAnswer(opt)}
                style={{
                  border: isSelected ? '3px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '12px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: isSelected ? '#fdf0ed' : '#fff',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '5px', left: '10px', fontWeight: 'bold', fontSize: '18px', color: isSelected ? '#e74c3c' : '#777' }}>{letter}</div>
                <img src={opt} alt={`Option ${letter}`} style={{ maxWidth: '100%', height: '100px', objectFit: 'contain', marginTop: '20px' }} />
              </div>
            );
          })}
        </div>
"""
    else:
        options_render = """
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: (q.options && q.options.length > 0 && q.options.every(o => /^[A-Z]$/.test(o)) || q.testType === 'TIKI 6' || q.testType === 'TIKI 3') ? '1fr 1fr' : '1fr', 
          gap: '15px', 
          marginBottom: '40px', 
          maxWidth: '500px', 
          margin: '0 auto' 
        }}>
          {q.options && q.options.length > 0 ? q.options.map((opt, idx) => {
            const isSelected = """ + ("answers[q.id]?.includes(opt)" if is_multi else "answers[q.id] === opt") + """;
            const letter = String.fromCharCode(65 + idx);
            const isSingleLetter = /^[A-Z]$/.test(opt);
            const isTiki6 = q.testType === 'TIKI 6';
            const isTiki3 = q.testType === 'TIKI 3';
            const isGrid = q.options.every(o => /^[A-Z]$/.test(o)) || isTiki6 || isTiki3;
            const isLastOdd = isGrid && q.options.length % 2 !== 0 && idx === q.options.length - 1;
            
            let labelContent;
            if (isTiki6 || isSingleLetter) {
                labelContent = <span style={{ fontWeight: 'bold' }}>{opt}</span>;
            } else {
                labelContent = <><span style={{ marginRight: '15px', fontWeight: 'bold', color: isSelected ? 'white' : '#888' }}>{letter})</span>{opt}</>;
            }

            return (
              <button 
                key={idx}
                onClick={() => handleAnswer(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: (isTiki6 || isSingleLetter) ? 'center' : 'flex-start',
                  gridColumn: isLastOdd ? '1 / -1' : 'auto',
                  padding: '15px 25px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: isSelected ? '#3498db' : '#f9f9f9',
                  color: isSelected ? 'white' : '#333',
                  border: isSelected ? '2px solid #2980b9' : '2px solid #ddd',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                {labelContent}
              </button>
            )
          }) : (
            <div style={{ gridColumn: '1 / -1', maxWidth: '300px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Ketik jawaban di sini..."
                value={(answers[q.id] as any) || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value as any })}
                style={{ width: '100%', padding: '15px', fontSize: '20px', textAlign: 'center', borderRadius: '12px', border: '2px solid #3498db', outline: 'none' }}
              />
            </div>
          )}
        </div>
"""

    return f"""'use client';

import {{ useState, useEffect }} from 'react';
import {{ useRouter }} from 'next/navigation';

interface Question {{
  id: number;
  testType: string;
  content: string;
  options: string[];
}}

export default function {name}() {{
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  {multi_state}
  const [loading, setLoading] = useState(true);
  const [showInstruction, setShowInstruction] = useState(true);
  const router = useRouter();

  useEffect(() => {{
    fetch('/api/questions?testType={test_type}')
      .then(res => res.json())
      .then(data => {{
        if (data.success) {{
          setQuestions(data.questions);
        }}
        setLoading(false);
      }});
  }}, []);

  if (loading) return <div style={{{{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}}}>Memuat soal {name}...</div>;
  if (questions.length === 0) return <div style={{{{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}}}>Tidak ada soal {name} yang tersedia.</div>;

  const handleNext = () => setCurrentIndex(prev => prev + 1);
  const handlePrev = () => setCurrentIndex(prev => prev - 1);
{multi_handler}

  if (showInstruction) {{
    return (
      <div style={{{{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}}}>
        <div style={{{{ maxWidth: '700px', background: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', textAlign: 'center' }}}}>
          <h2 style={{{{ fontSize: '32px', color: '#2c3e50', marginBottom: '20px', fontWeight: '800' }}}}>{title}</h2>
          <div style={{{{ textAlign: 'left', background: '#f8fbff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #3498db', marginBottom: '35px', lineHeight: '1.7', color: '#444', fontSize: '16px' }}}}>
            {instruction_html}
          </div>
          <button 
            onClick={{() => setShowInstruction(false)}}
            style={{{{ padding: '18px 45px', fontSize: '18px', background: 'linear-gradient(to right, #3498db, #2980b9)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(52, 152, 219, 0.3)', transition: 'transform 0.2s' }}}}
            onMouseOver={{(e) => e.currentTarget.style.transform = 'translateY(-2px)'}}
            onMouseOut={{(e) => e.currentTarget.style.transform = 'translateY(0)'}}
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    );
  }}

  const q = questions[currentIndex];

  return (
    <div style={{{{ padding: '30px', fontFamily: '"Inter", sans-serif', background: '#f4f7f6', minHeight: '100vh', color: '#333' }}}}>
      <div style={{{{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}}}>
        
        <div style={{{{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '30px' }}}}>
          <h2 style={{{{ margin: 0 }}}}>Ujian Psikotes: {{q.testType}}</h2>
          <div style={{{{ background: '#34495e', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}}}>
            Soal {{currentIndex + 1}} / {{questions.length}}
          </div>
        </div>

{content_render}
{options_render}

        <div style={{{{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #eaeaea', paddingTop: '20px' }}}}>
          <button 
            disabled={{currentIndex === 0}}
            onClick={{handlePrev}}
            style={{{{ padding: '12px 24px', background: currentIndex === 0 ? '#f5f5f5' : '#fff', color: currentIndex === 0 ? '#aaa' : '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}}}
          >
            ← Sebelumnya
          </button>

          {{currentIndex === questions.length - 1 ? (
            <button 
              onClick={{() => {{
                alert('Ujian Selesai! Menyimpan jawaban...');
                router.push('/');
              }}}}
              style={{{{ padding: '12px 24px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)' }}}}
            >
              Selesai & Kumpulkan
            </button>
          ) : (
            <button 
              onClick={{handleNext}}
              style={{{{ padding: '12px 24px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)' }}}}
            >
              Selanjutnya →
            </button>
          )}}
        </div>
      </div>
    </div>
  );
}}
"""

configs = [
    ("CFIT1", "CFIT 1", "CFIT Subtes 1", False, True, False),
    ("CFIT2", "CFIT 2", "CFIT Subtes 2", True, True, False),
    ("CFIT3", "CFIT 3", "CFIT Subtes 3", False, True, False),
    ("CFIT4", "CFIT 4", "CFIT Subtes 4", False, True, False),
    ("IST2", "IST 2", "IST 2 - Kemampuan Kata", False, False, False),
    ("IST3", "IST 3", "IST 3 - Analogi Kata", False, False, False),
    ("IST6", "IST 6", "IST 6 - Deret Angka", False, False, False),
    ("IST7", "IST 7", "IST 7 - Bentuk Ruang", False, True, False),
    ("TIKI1", "TIKI 1", "TIKI 1 - Berhitung", False, False, False),
    ("TIKI2", "TIKI 2", "TIKI 2 - Gabungan Bagian", True, True, False),
    ("TIKI3", "TIKI 3", "TIKI 3 - Hubungan Kata", True, False, False),
    ("TIKI4", "TIKI 4", "TIKI 4 - Abstraktif", True, True, False),
    ("TIKI6", "TIKI 6", "TIKI 6 - Ketelitian", False, False, False),
    ("WPT", "WPT", "WPT - Wonderlic Personnel Test", False, False, False),
]

for name, test_type, title, is_multi, content_is_img, options_is_img in configs:
    code = generate_component(name, test_type, title, is_multi, content_is_img, options_is_img, examples.get(f"{name}.tsx", ""))
    filepath = os.path.join(base_dir, f"{name}.tsx")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Recovered {name}.tsx")

