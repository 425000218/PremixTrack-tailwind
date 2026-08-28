import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

export function generateFallbackAnalysis(mode: string, contextData: any): string {
  return `### ?? B�O C�O PH�N T�CH CHU?I CUNG ?NG & �I?U PH?I PREMIX (PremixTrack Engine)

#### 1. C�c di?m n�ng thi?u h?t kh?n c?p (Critical Shortages):
- **Nh� m�y �?ng Nai (DDN)**:
  - **L-Threonine 98.5% (M� 2580003)**: T?n kho ch? c�n **4.2 ng�y** (T?n 4,200 kg / D�ng 1,000 kg/ng�y).
    * *�on h�ng dang v?*: PO-D365-88903 (10,000 kg) d? ki?n v? ng�y **17/08** (Xe 51D-894.22).
    * *H�nh d?ng*: C?n b�m s�t l? tr�nh xe t?i v� xem x�t di?u chuy?n g?p **3,000 kg** t? **Nh� m�y B�nh Duong (DBD)** (noi dang du DOI 47.3 ng�y, c? ly ch? 35km).
  - **Phytase 5000 FTU (M� 2580008)**: T?n kho nguy c?p **5.0 ng�y**. Xe t?i 60C-672.15 dang tr�n du?ng v? c?ng C�i M�p.

- **Nh� m�y Vinh Long (DVL)**:
  - **Vitamin C Phosphate 35% (M� 2580007)**: T?n kho ch? c�n **5.6 ng�y** do dang v�o v? nu�i th?y s?n cao di?m.
    * *�on h�ng Inbound*: 8,000 kg (PO-D365-88905) c?p c?ng C�t L�i ng�y 19/08.

#### 2. Co h?i t?i uu di?u chuy?n n?i b? (Inter-Factory Balancing):
- **L-Threonine**: DBD th?a 26,000 kg -> �i?u chuy?n 3,000 kg sang DDN (Th?i gian v?n chuy?n ~ 1.5 gi?).
- **Monocalcium Phosphate (MCP)**: DDN du 185 t?n (DOI 34.5 ng�y) -> H? tr? DBD dang thi?u h?t ch? c�n 14.3 ng�y t?n kho.

#### 3. K? ho?ch chuy?n d?i c�ng th?c (Planned Substitution):
- **Vitamin AD3E (M� cu 2580005)**: T?n kho t?i DBD c�n 1,200 kg. D? ki?n x? h?t trong 4 ng�y t?i v� t? d?ng k�ch ho?t chuy?n giao 100% sang m� th? h? m?i **2580006 (Bio-Stab)**.`;
}

export async function analyzeSupplyChainWithAI(
  prompt: string,
  contextData: any,
  mode: string,
  snapshotDate: string = '2026-08-25',
  positionSnapshotData: any = null
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const systemInstruction = `B?n l� Chuy�n gia C? v?n Chu?i Cung ?ng Cao C?p (Senior SCM & Premix AI Advisor) c?a PremixTrack.

QUY T?C TR�NH B�Y HI?N �?I (MODERN BENTO CARD PRESENTATION):
1. TR?C DI?N, NG?N G?N & KH�NG V�NG VO: �i th?ng v�o c�u h?i c?a ngu?i d�ng ngay t? d�ng d?u ti�n. Kh�ng vi?t van m? b�i d�i d�ng.
2. C?U TR�C PH?N H?I TH�NH 3 KH?I BENTO TR?C QUAN:

### ?? 1. �I?M N�NG C?N X? L� NGAY
(Ch? li?t k� c�c SKU th?c s? nguy c?p DOI < 7 ng�y du?i d?ng th? s�c t�ch, v� d?:
� [DBD] B?p 2579: T?n 12.9 t?n | Ti�u hao: 25.2 T/ng�y | DOI: 0.5 ng�y (C?n ng�y mai 26/08) | PO: 0 t?n
� [DDN] B?p 2579: T?n 10.7 t?n | Ti�u hao: 4.8 T/ng�y | DOI: 2.2 ng�y (C?n ng�y 27/08) | PO: 0 t?n)

### ?? 2. SO �? �I?U CHUY?N N?I B? T?I UU C? LY
(Tr�nh b�y d?ng so d? lu?ng mui t�n r� r�ng, k�m l� do v� s? ng�y c?u nguy:
� [ DBQ (T?n 38.4T) ] --( Chuy?n 15,000 kg / C? ly 35km )--? [ DBD ]  ? C?u DBD th�m 0.6 ng�y, ch? PO
� [ DBQ (T?n 38.4T) ] --( Chuy?n 5,000 kg / C? ly 35km )--? [ DDN ]  ? K�o d�i DOI DDN l�n 3.2 ng�y
� [ HPG2 (T?n 66.4T) ] --( Chuy?n 20,000 kg / C? ly 45km )--? [ DVP ] ? K�o d�i DOI DVP l�n 4.5 ng�y)

### ?? 3. H�NH �?NG MUA H�NG & T?I UU V?N
� [ Mua G?p / Expedite ]: ��n d?c NCC giao tru?c 30-50T trong PO 95.8T c?a DBQ v? th?ng DBD; ph�t h�nh Spot PO m?i cho DBD.
� [ T?m Ho�n / X? T?n ]: T?m d?ng PO Barley t?i Mi?n Nam (DHG dang du 73T, DOI 232 ng�y); ho�n PO DCP/Mu?i t?n > 75 ng�y.

3. KHI NGU?I D�NG H?I C�U H?I T�NH HU?NG C? TH? (VD: Chi ph� v?n chuy?n, tr? PO, x? t?n AD3E):
- Tr? l?i ngay ph�p t�nh to�n v� k?t qu? t�i ch�nh/s? li?u ? d?u ph?n h?i.
- B?ng d? to�n chi ph� ng?n g?n, r� r�ng.`;

  const userContent = `D? li?u Ma Tr?n V? Th? Cung ?ng Th?c T? (Position Matrix Cut-off: ${snapshotDate}):
${positionSnapshotData ? JSON.stringify(positionSnapshotData, null, 2) : '(S? d?ng d? li?u contextData)'}

D? li?u b? sung kh�c:
${JSON.stringify(contextData || {}, null, 2)}

Y�u c?u ph�n t�ch:
Ch? d?: ${mode || 'POSITION_SCM_ANALYSIS'}
C�u h?i / Y�u c?u c? th?: ${prompt || 'H�y ph�n t�ch chi ti?t Ma tr?n V? th? Cung ?ng (Position Matrix) ng�y 25/08/2026, ch? r� c�c nh� m�y dang c� nguy co c?n h�ng kh?n c?p v� d? xu?t k? ho?ch di?u ph?i n?i b? cung nhu x? t?n kho hi?u qu? nh?t.'}`;

  const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.7-flash'];
  let lastErr: any = null;

  for (const m of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: m,
        contents: userContent,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${m} failed, trying next candidate...`, err.message || err);
    }
  }

  throw lastErr || new Error('Kh�ng nh?n du?c ph?n h?i t? m� h�nh AI.');
}
