import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  VerticalAlign,
} from 'docx';

// Default Aspect Descriptions & Mapping
const ASPECT_DESCRIPTIONS: Record<string, string> = {
  "Inteligensi Umum": "Kemampuan untuk memecahkan persoalan yang sifatnya kompleks dan baru.",
  "Daya Analisa": "Mampu mengolah dan mengidentifikasi keterkaitan informasi; menghubungkan data dari berbagai sumber.",
  "Logika Berpikir": "Kemampuan untuk berpikir runtut, terarah, praktis dan logis dengan penalaran masuk akal.",
  "Daya Abstraksi": "Kemampuan untuk menelaah persoalan dari berbagai sudut pandang dan berpikir antisipatif.",
  "Problem Solving": "Kemampuan membuat keputusan tepat dengan mempertimbangkan efektivitas solusi.",
  "Stabilitas Emosi": "Kemampuan mengendalikan diri dan bersikap tenang dalam situasi penuh tekanan.",
  "Kepekaan Emosi / Sosial": "Mampu memahami perasaan orang lain dan berempati secara wajar.",
  "Kepercayaan Diri": "Yakin pada kapasitas diri, berani mengambil sikap tegas dan asertif.",
  "Sosiabilitas": "Minat sosial, mampu menciptakan impresi baik dan menjalin relasi interpersonal.",
  "Adaptasi": "Kemampuan menyesuaikan diri secara luwes terhadap perubahan lingkungan atau tugas baru.",
  "Komunikasi": "Mampu menyampaikan gagasan secara jelas, lugas, dan persuasif.",
  "Orientasi Berprestasi": "Dorongan untuk mencapai target unggul dan standar performa optimal.",
  "Daya Juang": "Ketekunan, persistensi, dan keuletan dalam menuntaskan rintangan kerja.",
  "Kedetailan": "Cermat terhadap detail operasional serta meminimalkan kesalahan kerja.",
  "Sistematika Kerja": "Bekerja secara terencana, berurutan, terorganisir, dan terstruktur.",
  "Kecepatan Kerja": "Tempo penyelesaian tugas dengan ritme dinamis dan efisien.",
  "Ketelitian Kerja": "Akurasi tinggi dan kecermatan dalam pemrosesan data/dokumen.",
  "Daya Tahan Stress": "Resiliensi mental saat menghadapi beban kerja tinggi atau tenggat waktu ketat.",
  "Kepemimpinan": "Kemampuan memandu, memotivasi, dan mengarahkan orang lain mencapai tujuan bersama.",
  "Inisiatif": "Proaktif mengambil tindakan tanpa harus menunggu instruksi atasan.",
  "Tanggung Jawab": "Komitmen tinggi atas tugas dan integritas terhadap hasil kerja.",
  "Kerjasama": "Kesediaan berkolaborasi dan berkontribusi secara suportif dalam kelompok kerja.",
  "Pengambilan Keputusan": "Keberanian menentukan pilihan solusi secara cepat dan terukur.",
};

const DEFAULT_PRESET_MAPPING = [
  {
    category: "I. KEMAMPUAN KOGNITIF",
    aspects: [
      { name: "IQ / Kapasitas Intelektual", checked: true },
      { name: "Daya Analisa", checked: true },
      { name: "Logika Berpikir", checked: true },
      { name: "Daya Abstraksi", checked: true },
      { name: "Problem Solving", checked: true },
    ]
  },
  {
    category: "II. SISI AFEKTIF",
    aspects: [
      { name: "Stabilitas Emosi", checked: true },
      { name: "Kepekaan Emosi / Sosial", checked: true },
      { name: "Kepercayaan Diri", checked: true },
    ]
  },
  {
    category: "III. HUBUNGAN ANTAR MANUSIA",
    aspects: [
      { name: "Sosiabilitas", checked: true },
      { name: "Adaptasi", checked: true },
      { name: "Komunikasi", checked: true },
    ]
  },
  {
    category: "IV. SIKAP KERJA",
    aspects: [
      { name: "Orientasi Berprestasi", checked: true },
      { name: "Daya Juang", checked: true },
      { name: "Kedetailan", checked: true },
      { name: "Sistematika Kerja", checked: true },
      { name: "Kecepatan Kerja", checked: true },
      { name: "Ketelitian Kerja", checked: true },
      { name: "Daya Tahan Stress", checked: true },
      { name: "Kepemimpinan", checked: true },
      { name: "Inisiatif", checked: true },
      { name: "Tanggung Jawab", checked: true },
      { name: "Kerjasama", checked: true },
      { name: "Pengambilan Keputusan", checked: true },
    ]
  }
];

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Harap login terlebih dahulu' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['superadmin', 'psikolog'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden: Akses laporan khusus Superadmin dan Psikolog' }, { status: 403 });
    }

    const params = await context.params;
    const participantId = parseInt(params.id, 10);
    if (isNaN(participantId)) {
      return NextResponse.json({ error: 'ID Peserta tidak valid' }, { status: 400 });
    }

    const participant = await prisma.testParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: { select: { id: true, name: true, username: true, email: true, license: true } },
        jobPosition: { include: { grayAreas: true, psychographPreset: true } },
        test: {
          include: {
            jobPosition: { include: { grayAreas: true, psychographPreset: true } },
            client: { select: { name: true } }
          }
        },
        psychoResults: true,
        normResults: true
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Role check for assigned batches if role is psikolog
    if (userRole === 'psikolog') {
      const assignedTestIdsStr = (session.user as any).assignedTestIds;
      if (!assignedTestIdsStr) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak ditugaskan ke batch ini.' }, { status: 403 });
      }
      try {
        const testIds: number[] = JSON.parse(assignedTestIdsStr);
        if (!Array.isArray(testIds) || !testIds.includes(participant.testId)) {
          return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk batch ini.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Akses ditolak: Gagal memvalidasi wewenang batch.' }, { status: 403 });
      }
    }

    // Parse Psychograph & Review Data
    const jobPosition = participant.test?.jobPosition || participant.jobPosition;
    const psychoResults = participant.psychoResults || ({} as any);

    let dinamika = {
      intelegensi: '',
      kepribadian: '',
      sikapKerja: '',
      kepemimpinan: '',
      kesimpulan: '',
      psychologistName: '',
      psychologistSipp: '',
      signatureUrl: ''
    };

    if (psychoResults.dinamika) {
      try {
        const parsed = JSON.parse(psychoResults.dinamika);
        dinamika = { ...dinamika, ...parsed };
      } catch (e) {}
    }

    let modifiedScores: Record<string, number> = {};
    if (psychoResults.modifiedScores) {
      try { modifiedScores = JSON.parse(psychoResults.modifiedScores); } catch (e) {}
    }

    // Gray area targets
    let grayAreas = jobPosition?.grayAreas || [];
    const grayAreasMap = grayAreas.reduce((acc: any, ga: any) => {
      acc[ga.parameter] = ga.targetScore;
      return acc;
    }, {});

    // Preset mapping
    let mapping: any[] = [];
    if (jobPosition?.psychographPreset?.mapping) {
      try { mapping = JSON.parse(jobPosition.psychographPreset.mapping); } catch (e) {}
    }
    if (!Array.isArray(mapping) || mapping.length === 0) {
      mapping = DEFAULT_PRESET_MAPPING;
    }

    const candidateName = participant.user?.name || 'Peserta';
    const positionName = participant.test?.title?.split('-')[0]?.trim() || jobPosition?.name || 'Posisi General';
    const examDate = participant.startTime
      ? new Date(participant.startTime).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      : '-';
    const currentDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const psychologistName = dinamika.psychologistName || (session.user as any).name || 'Dr. Rian Pratama, M.Psi., Psikolog';
    const psychologistSipp = dinamika.psychologistSipp || (session.user as any).license || '-';
    const signatureUrl = dinamika.signatureUrl || '';

    // Colors matching PDF executive styling
    const PRIMARY_CHARCOAL = "0F172A";
    const SECONDARY_SLATE = "475569";
    const BORDER_COLOR = "CBD5E1";
    const BG_LIGHT_SLATE = "F8FAFC";
    const BG_HEADER_TINT = "F1F5F9";
    const GREY_AREA_BG = "E2E8F0";

    // Read Logo if exists
    let logoBuffer: Buffer | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (e) {}

    const docChildren: any[] = [];
    const TOTAL_WIDTH_DXA = 10318; // Printable width in twips for A4 with 800 twips margins

    // ==========================================
    // PAGE 1: KOP SURAT RESMI, BIODATA, PSIKOGRAM
    // ==========================================

    // 1. Kop Surat Table (Logo + Company Identity + Confidential Box)
    const kopCells: TableCell[] = [];

    if (logoBuffer) {
      kopCells.push(
        new TableCell({
          width: { size: 1100, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 20, right: 40 },
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoBuffer,
                  transformation: { width: 48, height: 48 },
                } as any),
              ],
            }),
          ],
        })
      );
    }

    kopCells.push(
      new TableCell({
        width: { size: logoBuffer ? 6718 : 7818, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "HR PUBLIK CONSULTING & ASSESSMENT CENTER",
                font: "Arial",
                size: 21, // 10.5pt
                bold: true,
                color: PRIMARY_CHARCOAL,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Lembaga Layanan Psikologi Terapan & Evaluasi Potensi SDM",
                font: "Arial",
                size: 16, // 8pt
                bold: true,
                color: SECONDARY_SLATE,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Assessment Center • Rekrutmen & Seleksi • Konsultasi Pengembangan SDM",
                font: "Arial",
                size: 14, // 7pt
                color: "64748B",
              }),
            ],
          }),
        ],
      })
    );

    kopCells.push(
      new TableCell({
        width: { size: 2500, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "CONFIDENTIAL",
                font: "Arial",
                size: 15,
                bold: true,
                color: "334155",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Ref: HRP/EVA/${participant.id?.toString().padStart(4, '0')}/${new Date().getFullYear()}`,
                font: "Arial",
                size: 13,
                color: "64748B",
              }),
            ],
          }),
        ],
      })
    );

    const kopTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: logoBuffer ? [1100, 6718, 2500] : [7818, 2500],
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_CHARCOAL }, // Thick rule
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({ children: kopCells }),
      ],
    });

    docChildren.push(kopTable);

    // Hairline under Kop Rule
    docChildren.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        },
        spacing: { before: 20, after: 80 },
      })
    );

    // 2. Document Title
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 20 },
        children: [
          new TextRun({
            text: "LAPORAN HASIL EVALUASI PSIKOLOGIS",
            font: "Arial",
            size: 23, // 11.5pt
            bold: true,
            color: PRIMARY_CHARCOAL,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: "INDIVIDUAL PSYCHOLOGICAL DIAGNOSTIC & COMPETENCY MATRIX",
            font: "Arial",
            size: 15, // 7.5pt
            bold: true,
            color: SECONDARY_SLATE,
          }),
        ],
      })
    );

    // 3. Candidate Bio Table (Tabel Dossier Resmi)
    const statusText = psychoResults.status === 'RELEASED' ? 'RELEASED (RESMI / FINAL)' : 'CONFIDENTIAL REVIEW (INTERNAL)';
    const bioTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [1800, 3359, 1800, 3359],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              shading: { fill: BG_LIGHT_SLATE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Nama Lengkap", font: "Arial", size: 16, bold: true, color: SECONDARY_SLATE })] })],
            }),
            new TableCell({
              width: { size: 3359, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: candidateName, font: "Arial", size: 17, bold: true, color: PRIMARY_CHARCOAL })] })],
            }),
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              shading: { fill: BG_LIGHT_SLATE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Posisi / Jabatan", font: "Arial", size: 16, bold: true, color: SECONDARY_SLATE })] })],
            }),
            new TableCell({
              width: { size: 3359, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: positionName, font: "Arial", size: 17, bold: true, color: PRIMARY_CHARCOAL })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              shading: { fill: BG_LIGHT_SLATE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Tanggal Evaluasi", font: "Arial", size: 16, bold: true, color: SECONDARY_SLATE })] })],
            }),
            new TableCell({
              width: { size: 3359, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: examDate, font: "Arial", size: 16, color: PRIMARY_CHARCOAL })] })],
            }),
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              shading: { fill: BG_LIGHT_SLATE },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Status Laporan", font: "Arial", size: 16, bold: true, color: SECONDARY_SLATE })] })],
            }),
            new TableCell({
              width: { size: 3359, type: WidthType.DXA },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: statusText, font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL })] })],
            }),
          ],
        }),
      ],
    });

    docChildren.push(bioTable);
    docChildren.push(new Paragraph({ spacing: { after: 120 } }));

    // 4. Psychogram Matrix Table
    const psychogramRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 2800, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: "ASPEK & DIMENSI", font: "Arial", size: 16, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 4518, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: "DEFINISI OPERASIONAL", font: "Arial", size: 16, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 40, right: 40 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KS (1)", font: "Arial", size: 14, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 40, right: 40 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "K (2)", font: "Arial", size: 14, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 40, right: 40 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "C (3)", font: "Arial", size: 14, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 40, right: 40 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "B (4)", font: "Arial", size: 14, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: "1E293B" },
            margins: { top: 90, bottom: 90, left: 40, right: 40 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BS (5)", font: "Arial", size: 14, bold: true, color: "FFFFFF" })] })],
          }),
        ],
      }),
    ];

    mapping.forEach((cat: any) => {
      const activeAsps = Array.isArray(cat.aspects) ? cat.aspects.filter((a: any) => a.checked) : [];
      if (activeAsps.length === 0) return;

      // Category Header Row
      psychogramRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 7,
              shading: { fill: BG_HEADER_TINT },
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cat.category.toUpperCase(), font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL })],
                }),
              ],
            }),
          ],
        })
      );

      // Aspect Rows
      activeAsps.forEach((asp: any) => {
        const aspectName = asp.name;
        const targetScore = grayAreasMap[aspectName] || 3;
        const finalScore = modifiedScores[aspectName] !== undefined ? modifiedScores[aspectName] : 3;

        const scoreCells: TableCell[] = [1, 2, 3, 4, 5].map((s) => {
          const isTarget = s === targetScore;
          const isActual = s === finalScore;
          return new TableCell({
            width: { size: 600, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 70, bottom: 70, left: 40, right: 40 },
            shading: isTarget ? { fill: GREY_AREA_BG } : undefined,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isActual ? "●" : "",
                    font: "Arial",
                    size: 21,
                    bold: true,
                    color: PRIMARY_CHARCOAL,
                  }),
                ],
              }),
            ],
          });
        });

        psychogramRows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: aspectName, font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL })] })],
              }),
              new TableCell({
                width: { size: 4518, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: asp.description || ASPECT_DESCRIPTIONS[aspectName] || "-",
                        font: "Arial",
                        size: 14, // 7pt
                        color: "475569",
                      }),
                    ],
                  }),
                ],
              }),
              ...scoreCells,
            ],
          })
        );
      });
    });

    const psychogramTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [2800, 4518, 600, 600, 600, 600, 600],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_CHARCOAL },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_CHARCOAL },
        left: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_CHARCOAL },
        right: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_CHARCOAL },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      },
      rows: psychogramRows,
    });

    docChildren.push(psychogramTable);

    // Legend Box (Footnote style)
    docChildren.push(
      new Table({
        width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: [TOTAL_WIDTH_DXA],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: BG_LIGHT_SLATE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new TextRun({ text: "Keterangan:  [Area Abu-abu] Standar Profil Jabatan (Target)   |   [●] Skor Capaian Individu Peserta   |   1: Kurang Sekali • 2: Kurang • 3: Cukup • 4: Baik • 5: Baik Sekali", font: "Arial", size: 14, color: "475569" }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // ==========================================
    // PAGE BREAK: PINDAH KE HALAMAN 2
    // ==========================================
    docChildren.push(
      new Paragraph({
        children: [],
        pageBreakBefore: true,
      })
    );

    // ==========================================
    // PAGE 2: REKOMENDASI, DINAMIKA, KELEBIHAN, PENGESAHAN
    // ==========================================

    // Page 2 Mini Header
    docChildren.push(
      new Table({
        width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: [5159, 5159],
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_CHARCOAL },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5159, type: WidthType.DXA },
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "HR PUBLIK ASSESSMENT CENTER", font: "Arial", size: 15, bold: true, color: PRIMARY_CHARCOAL }),
                      new TextRun({ text: " • Laporan Evaluasi Psikologis", font: "Arial", size: 15, color: SECONDARY_SLATE }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 5159, type: WidthType.DXA },
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({ text: "Kandidat: ", font: "Arial", size: 15, color: SECONDARY_SLATE }),
                      new TextRun({ text: candidateName, font: "Arial", size: 15, bold: true, color: PRIMARY_CHARCOAL }),
                      new TextRun({ text: " • Jabatan: ", font: "Arial", size: 15, color: SECONDARY_SLATE }),
                      new TextRun({ text: positionName, font: "Arial", size: 15, bold: true, color: PRIMARY_CHARCOAL }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
    docChildren.push(new Paragraph({ spacing: { after: 180 } }));

    // 5. Section I: Kesimpulan Rekomendasi Jabatan (Executive Cards)
    const recText = psychoResults.recommendation || 'DIPERTIMBANGKAN';

    const recTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [3439, 3439, 3440],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              shading: { fill: PRIMARY_CHARCOAL },
              margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "I. KESIMPULAN REKOMENDASI JABATAN", font: "Arial", size: 16, bold: true, color: "FFFFFF" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            // DISARANKAN
            new TableCell({
              width: { size: 3439, type: WidthType.DXA },
              shading: recText === 'DISARANKAN' ? { fill: "ECFDF5" } : { fill: "FAFAFA" },
              margins: { top: 130, bottom: 130, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 30 },
                  children: [
                    new TextRun({
                      text: recText === 'DISARANKAN' ? "✔ DISARANKAN" : "DISARANKAN",
                      font: "Arial",
                      size: 19,
                      bold: true,
                      color: recText === 'DISARANKAN' ? "047857" : "94A3B8",
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 50 },
                  children: [
                    new TextRun({
                      text: "Memenuhi seluruh kompetensi psikologis yang dipersyaratkan.",
                      font: "Arial",
                      size: 14,
                      color: recText === 'DISARANKAN' ? "065F46" : "94A3B8",
                    }),
                  ],
                }),
              ],
            }),
            // DIPERTIMBANGKAN
            new TableCell({
              width: { size: 3439, type: WidthType.DXA },
              shading: recText === 'DIPERTIMBANGKAN' ? { fill: "FFFBEB" } : { fill: "FAFAFA" },
              margins: { top: 130, bottom: 130, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 30 },
                  children: [
                    new TextRun({
                      text: recText === 'DIPERTIMBANGKAN' ? "✔ DIPERTIMBANGKAN" : "DIPERTIMBANGKAN",
                      font: "Arial",
                      size: 19,
                      bold: true,
                      color: recText === 'DIPERTIMBANGKAN' ? "B45309" : "94A3B8",
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 50 },
                  children: [
                    new TextRun({
                      text: "Memenuhi kualifikasi dasar dengan beberapa catatan pengembangan.",
                      font: "Arial",
                      size: 14,
                      color: recText === 'DIPERTIMBANGKAN' ? "92400E" : "94A3B8",
                    }),
                  ],
                }),
              ],
            }),
            // TIDAK DISARANKAN
            new TableCell({
              width: { size: 3440, type: WidthType.DXA },
              shading: recText === 'TIDAK DISARANKAN' ? { fill: "FEF2F2" } : { fill: "FAFAFA" },
              margins: { top: 130, bottom: 130, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 30 },
                  children: [
                    new TextRun({
                      text: recText === 'TIDAK DISARANKAN' ? "✔ TIDAK DISARANKAN" : "TIDAK DISARANKAN",
                      font: "Arial",
                      size: 19,
                      bold: true,
                      color: recText === 'TIDAK DISARANKAN' ? "B91C1C" : "94A3B8",
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 50 },
                  children: [
                    new TextRun({
                      text: "Belum memenuhi standar kompetensi minimal posisi jabatan.",
                      font: "Arial",
                      size: 14,
                      color: recText === 'TIDAK DISARANKAN' ? "991B1B" : "94A3B8",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(recTable);
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    // 6. Section II: Dinamika Psikologis & Deskripsi Kompetensi
    const dinamikaTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [TOTAL_WIDTH_DXA],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: PRIMARY_CHARCOAL },
              margins: { top: 70, bottom: 70, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "II. DINAMIKA PSIKOLOGIS & DESKRIPSI KOMPETENSI", font: "Arial", size: 16, bold: true, color: "FFFFFF" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 120, bottom: 120, left: 140, right: 140 },
              children: [
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [
                    new TextRun({ text: "A. Kapasitas Inteligensi & Kemampuan Kognitif: ", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                    new TextRun({ text: dinamika.intelegensi || "-", font: "Arial", size: 16, color: "1E293B" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [
                    new TextRun({ text: "B. Dinamika Kepribadian & Relasi Sosial: ", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                    new TextRun({ text: dinamika.kepribadian || "-", font: "Arial", size: 16, color: "1E293B" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [
                    new TextRun({ text: "C. Sikap & Pola Kerja Operasional: ", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                    new TextRun({ text: dinamika.sikapKerja || "-", font: "Arial", size: 16, color: "1E293B" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [
                    new TextRun({ text: "D. Potensi Kepemimpinan & Pengambilan Keputusan: ", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                    new TextRun({ text: dinamika.kepemimpinan || "-", font: "Arial", size: 16, color: "1E293B" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  border: { top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR } },
                  children: [
                    new TextRun({ text: "E. Kesimpulan Profil Keseluruhan: ", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                    new TextRun({ text: dinamika.kesimpulan || "-", font: "Arial", size: 16, bold: true, color: PRIMARY_CHARCOAL }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(dinamikaTable);
    docChildren.push(new Paragraph({ spacing: { after: 200 } }));

    // 7. Section III: Poin Kekuatan & Area Pengembangan (Formal 2-Column Table)
    const swTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [5159, 5159],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5159, type: WidthType.DXA },
              shading: { fill: "F0FDF4" },
              margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: [new TextRun({ text: "POIN KEKUATAN UTAMA (KEY STRENGTHS)", font: "Arial", size: 15, bold: true, color: "047857" })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 5159, type: WidthType.DXA },
              shading: { fill: "FFFBEB" },
              margins: { top: 70, bottom: 70, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: [new TextRun({ text: "AREA PENGEMBANGAN (DEVELOPMENT AREAS)", font: "Arial", size: 15, bold: true, color: "B45309" })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5159, type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: psychoResults.kelebihan || "-", font: "Arial", size: 15, color: "1E293B" })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 5159, type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: psychoResults.kelemahan || "-", font: "Arial", size: 15, color: "1E293B" })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    docChildren.push(swTable);
    docChildren.push(new Paragraph({ spacing: { after: 240 } }));

    // 8. Section IV: Pengesahan & Tanda Tangan Psikolog
    const sigChildren: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `Semarang, ${examDate !== '-' ? examDate : currentDateStr}`, font: "Arial", size: 16, color: "334155" })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [new TextRun({ text: "Psikolog Pemeriksa / Assessor,", font: "Arial", size: 17, bold: true, color: PRIMARY_CHARCOAL })],
      }),
    ];

    // Signature image if exists
    if (signatureUrl && signatureUrl.startsWith('data:image/')) {
      try {
        const base64Data = signatureUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        sigChildren.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 30, after: 30 },
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: { width: 130, height: 50 },
              } as any),
            ],
          })
        );
      } catch (e) {
        sigChildren.push(new Paragraph({ spacing: { after: 500 } }));
      }
    } else {
      sigChildren.push(new Paragraph({ spacing: { after: 600 } }));
    }

    sigChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: psychologistName,
            font: "Arial",
            size: 18,
            bold: true,
            underline: {},
            color: PRIMARY_CHARCOAL,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `No. SIPP: ${psychologistSipp}`,
            font: "Arial",
            size: 14,
            bold: true,
            color: SECONDARY_SLATE,
          }),
        ],
      })
    );

    const endorsementTable = new Table({
      width: { size: TOTAL_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [6000, 4318],
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            // Left: Disclaimer
            new TableCell({
              width: { size: 6000, type: WidthType.DXA },
              verticalAlign: VerticalAlign.BOTTOM,
              margins: { top: 60, bottom: 60, left: 40, right: 40 },
              children: [
                new Paragraph({
                  spacing: { after: 10 },
                  children: [
                    new TextRun({
                      text: "*Dokumen ini merupakan hasil evaluasi psikologis yang bersifat RAHASIA (CONFIDENTIAL). Interpretasi hasil asesmen hanya dapat dilakukan oleh Psikolog yang berwenang untuk tujuan seleksi dan penempatan SDM.",
                      font: "Arial",
                      size: 13, // 6.5pt
                      italics: true,
                      color: "64748B",
                    }),
                  ],
                }),
              ],
            }),
            // Right: Psychologist Signature Block
            new TableCell({
              width: { size: 4318, type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 40, right: 40 },
              children: sigChildren,
            }),
          ],
        }),
      ],
    });

    docChildren.push(endorsementTable);

    // Build Word Document with exact matching A4 margins
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch (~1.27cm)
                bottom: 720,
                left: 800,   // ~1.4cm
                right: 800,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const cleanFileName = `Laporan_Psikotes_${candidateName.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Export DOCX Error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor dokumen Word: ' + error.message }, { status: 500 });
  }
}
