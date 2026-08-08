import os
import re

files_to_patch = [
    'CFIT1.tsx', 'CFIT2.tsx', 'CFIT3.tsx', 'CFIT4.tsx',
    'TIKI1.tsx', 'TIKI2.tsx', 'TIKI3.tsx', 'TIKI4.tsx', 'TIKI6.tsx',
    'IST2.tsx', 'IST3.tsx', 'IST6.tsx', 'IST7.tsx'
]

base_dir = r"d:\Kuliah\Kerja\psikotes\psikotes-app\src\components\tests"

pattern_bottom = re.compile(
    r"(</button>\s*\)\s*}\s*</div>\s*</div>\s*</div>\s*\);\s*}[\s\n]*$)"
)

sidebar_code = """
      </div>

      {/* Navigation Sidebar */}
      <div style={{ width: '300px', flexShrink: 0, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'sticky', top: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>Daftar Soal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {questions.map((qItem, idx) => {
            const isAnswered = !!answers[qItem.id];
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: isCurrent ? '2px solid #2c3e50' : (isAnswered ? '1px solid #2ecc71' : '1px solid #ccc'),
                  background: isCurrent ? '#2c3e50' : (isAnswered ? '#2ecc71' : '#fff'),
                  color: (isCurrent || isAnswered) ? 'white' : '#333',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        
        <div style={{ marginTop: '25px', fontSize: '14px', color: '#666', borderTop: '2px solid #eaeaea', paddingTop: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ width: '16px', height: '16px', background: '#2ecc71', borderRadius: '4px', marginRight: '10px' }}></div> 
            <span>Sudah Dijawab ({Object.keys(answers).length})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '16px', height: '16px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginRight: '10px' }}></div> 
            <span>Belum Dijawab ({questions.length - Object.keys(answers).length})</span>
          </div>
        </div>
      </div>

    </div>
  </div>
  );
}
"""

def patch_file(filename):
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content, count2 = pattern_bottom.subn(r"</button>\n          )}\n        </div>" + sidebar_code, content)
    if count2 == 0:
        print(f"Failed bottom patch in {filename}")
        return

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched {filename}")

for f in files_to_patch:
    patch_file(f)
