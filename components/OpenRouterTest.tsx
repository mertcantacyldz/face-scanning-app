import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

interface TestResult {
  scenario: string;
  status: 'pending' | 'running' | 'success' | 'error';
  statusCode?: number;
  error?: string;
  responseTime?: number;
  promptLength: number;
  rateLimitHeaders?: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };
  retryAfter?: string;
}

const TEST_SCENARIOS = [
  {
    id: 1,
    name: 'Çok Kısa Prompt',
    description: 'Baseline test - API çalışıyor mu?',
    prompt: 'Nasılsın?',
  },
  {
    id: 2,
    name: 'Orta Uzunluk',
    description: 'Normal kullanım senaryosu (~2500 karakter)',
    prompt: `Modern web development has evolved significantly over the past decade. React, Vue, and Angular have become the dominant frameworks for building user interfaces. These frameworks provide developers with powerful tools to create dynamic, responsive web applications that can handle complex state management and user interactions. The introduction of TypeScript has also revolutionized how developers write JavaScript code, providing type safety and better tooling support. Backend development has seen similar transformations with the rise of Node.js, which allows developers to use JavaScript on the server side. Database technologies have also evolved, with NoSQL databases like MongoDB becoming popular alternatives to traditional SQL databases. The DevOps culture has emphasized the importance of continuous integration and continuous deployment, making it easier for teams to ship code faster and more reliably. Cloud platforms like AWS, Google Cloud, and Azure have made it possible to deploy and scale applications without managing physical servers. Containerization with Docker and orchestration with Kubernetes have further simplified deployment processes. Modern development also emphasizes testing, with tools like Jest, Cypress, and Testing Library making it easier to write and maintain test suites. The JAMstack architecture has gained popularity for building fast, secure websites that are easy to deploy. API design has moved towards GraphQL in many cases, offering more flexibility than traditional REST APIs. Progressive Web Apps (PWAs) have blurred the line between web and native applications, providing offline capabilities and push notifications. The focus on performance has led to the development of techniques like code splitting, lazy loading, and server-side rendering. Accessibility has become a crucial consideration, with developers learning to build applications that work for everyone. The rise of headless CMS platforms has separated content management from presentation, giving developers more flexibility. Mobile development has been transformed by React Native and Flutter, allowing developers to build cross-platform applications with a single codebase.`,
  },
  {
    id: 3,
    name: 'Uzun Prompt',
    description: 'Rate limit test (~10000 karakter)',
    prompt: `${'The history of computing spans several centuries, beginning with early mechanical calculating devices and evolving into the sophisticated digital systems we use today. The abacus, invented thousands of years ago, was one of the first tools designed to assist with arithmetic calculations. In the 17th century, Blaise Pascal and Gottfried Wilhelm Leibniz created mechanical calculators that could perform addition, subtraction, multiplication, and division. Charles Babbage, in the 19th century, designed the Analytical Engine, a mechanical general-purpose computer that was never completed but laid the groundwork for modern computing concepts. Ada Lovelace, working with Babbage, wrote what is considered the first computer program, making her the worlds first programmer. The 20th century saw rapid advancements in computing technology. The development of electronic computers during World War II, such as the Colossus and ENIAC, marked a significant milestone. These early computers were enormous, filling entire rooms and consuming vast amounts of power. The invention of the transistor in 1947 revolutionized computing, allowing for smaller, more efficient, and more reliable computers. The integrated circuit, developed in the late 1950s, further miniaturized computer components and paved the way for modern microprocessors. The 1970s and 1980s witnessed the rise of personal computing, with companies like Apple, IBM, and Microsoft bringing computers into homes and offices. The graphical user interface (GUI) made computers more accessible to non-technical users. The internet, originally developed as a military communication network, became publicly available in the 1990s and transformed how people communicate, access information, and conduct business. The World Wide Web, created by Tim Berners-Lee, made the internet user-friendly and accessible to millions. The 21st century has seen exponential growth in computing power, data storage, and connectivity. Cloud computing has enabled on-demand access to computing resources over the internet. Artificial intelligence and machine learning have made significant strides, powering applications from virtual assistants to autonomous vehicles. The proliferation of smartphones and mobile devices has put powerful computing capabilities in the hands of billions of people worldwide. The Internet of Things (IoT) connects everyday objects to the internet, creating smart homes, cities, and industries. Quantum computing promises to solve problems that are currently intractable for classical computers. Blockchain technology has introduced new paradigms for secure, decentralized systems. As we look to the future, computing continues to evolve, with emerging technologies like augmented reality, virtual reality, and neuromorphic computing pushing the boundaries of what is possible. '.repeat(3)}`,
  },
  {
    id: 4,
    name: 'Çok Uzun Prompt',
    description: 'Maximum limit test (~20000+ karakter)',
    prompt: `${'In the vast expanse of human knowledge and technological advancement, we stand at a crossroads of unprecedented opportunity and challenge. The digital revolution has fundamentally transformed every aspect of our lives, from how we communicate and work to how we learn and entertain ourselves. The convergence of multiple technological trends—artificial intelligence, biotechnology, nanotechnology, and quantum computing—is creating a future that would have seemed like science fiction just a few decades ago. Artificial intelligence, in particular, has made remarkable progress, with deep learning algorithms achieving superhuman performance in tasks ranging from image recognition to game playing. Natural language processing has advanced to the point where machines can engage in meaningful conversations, translate languages in real-time, and generate human-like text. Computer vision systems can identify objects, faces, and emotions with high accuracy. Reinforcement learning has enabled agents to learn complex behaviors through trial and error, leading to breakthroughs in robotics and autonomous systems. The implications of AI are profound and far-reaching, touching every sector of the economy and society. In healthcare, AI is being used to diagnose diseases, discover new drugs, and personalize treatment plans. In finance, machine learning algorithms detect fraud, optimize trading strategies, and assess credit risk. In manufacturing, AI-powered robots and predictive maintenance systems improve efficiency and reduce downtime. In transportation, autonomous vehicles promise to reduce accidents, ease congestion, and provide mobility to those who cannot drive. The creative industries are not immune to AIs influence, with algorithms composing music, creating art, and writing stories. Education is being transformed by adaptive learning systems that tailor content to individual students needs. Agriculture is becoming more efficient with precision farming techniques that use AI to optimize crop yields and reduce resource consumption. Environmental monitoring and climate modeling benefit from AIs ability to process vast amounts of data and identify patterns. Smart cities use AI to manage traffic, energy consumption, and public services more effectively. The legal profession is exploring AI for document review, case prediction, and legal research. Customer service is increasingly automated with chatbots and virtual assistants. Marketing and advertising leverage AI for personalization and targeting. Supply chain management uses AI for demand forecasting and inventory optimization. Human resources departments employ AI for resume screening and candidate matching. The entertainment industry uses AI for content recommendation and production. Scientific research is accelerated by AI-assisted discovery and hypothesis generation. Cybersecurity relies on AI to detect and respond to threats in real-time. Space exploration benefits from AI for autonomous navigation and data analysis. The list goes on, illustrating the pervasive impact of artificial intelligence across all domains of human activity. However, with these opportunities come significant challenges and ethical considerations. '.repeat(5)}`,
  },
  {
    id: 5,
    name: 'Ardışık İstekler',
    description: '5 kısa istek art arda - rate limit testi',
    prompt: 'Test', // Will be called 5 times in succession
  },
  {
    id: 6,
    name: 'Gerçek Senaryo: Yüz Analizi',
    description: 'Facial landmarks analizi - gerçek kullanım senaryosu',
    prompt: `Sen bir yüz analizi uzmanısın. Aşağıdaki MediaPipe Face Mesh verilerini analiz et ve detaylı bir yorum yap.

**Facial Landmarks Verisi (468 nokta):**
Toplam Nokta: 468
Güven Skoru: 0.94
Yüz Kutusu: {x: 123, y: 234, width: 267, height: 289}

**Bölge Detayları:**
- Face Oval: 36 nokta
- Forehead: 31 nokta
- Jawline: 37 nokta
- Left Eye: 35 nokta, Right Eye: 37 nokta
- Left Eyebrow: 20 nokta, Right Eyebrow: 20 nokta
- Nose: 35 nokta, Nose Bridge: 21 nokta, Nose Tip: 18 nokta
- Lips: 32 nokta, Upper Lip: 42 nokta, Lower Lip: 38 nokta

**Örnek Landmark Koordinatları:**
- Sol Göz Köşe: {x: 0.3421, y: 0.4234, z: -0.0234}
- Sağ Göz Köşe: {x: 0.6543, y: 0.4198, z: -0.0198}
- Burun Ucu: {x: 0.4987, y: 0.5876, z: 0.0456}
- Sol Dudak: {x: 0.4123, y: 0.7234, z: -0.0123}
- Sağ Dudak: {x: 0.5876, y: 0.7198, z: -0.0156}

**Simetri Analizi:**
Sol-Sağ Göz Arası Mesafe: 0.3122
Göz-Burun Oranı: 1.234
Burun Genişliği: 0.156
Dudak Genişliği: 0.178

**Açı Ölçümleri:**
Çene Açısı: 124.5°
Alın Eğimi: 87.3°
Burun Köprü Açısı: 132.8°

Lütfen bu verilere dayanarak:
1. Yüz simetrisini değerlendir (0-100 puan)
2. Öne çıkan özellikleri belirt
3. Golden ratio'ya uyum skorunu hesapla
4. Genel estetik değerlendirme yap
5. İyileştirme önerileri sun (eğer varsa)

Yanıtını profesyonel, bilimsel ve anlayışlı bir dille ver. Kullanıcıya pozitif ve yapıcı geri bildirim sun.`,
  },
];

export default function OpenRouterTest() {
  const [testResults, setTestResults] = useState<TestResult[]>(
    TEST_SCENARIOS.map((scenario) => ({
      scenario: scenario.name,
      status: 'pending',
      promptLength: scenario.prompt.length,
    }))
  );
  const [isRunningAll, setIsRunningAll] = useState(false);

  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

  const logToConsole = (message: string, data?: any) => {
    console.log(`[OpenRouter Test] ${message}`, data || '');
  };

  const testPrompt = async (
    scenarioIndex: number,
    prompt: string
  ): Promise<TestResult> => {
    const startTime = Date.now();
    const scenario = TEST_SCENARIOS[scenarioIndex];

    logToConsole(`${scenario.name} başladı`);
    logToConsole('Request:', {
      endpoint: 'POST /api/v1/chat/completions',
      promptLength: `${prompt.length} characters`,
    });

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://face-scanning-app.local',
          'X-Title': 'FaceLoom Test',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free', // GERÇEK MODEL - lib/openrouter.ts ile aynı
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        }),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Extract rate limit headers
      const rateLimitHeaders = {
        limit: response.headers.get('x-ratelimit-limit') || undefined,
        remaining: response.headers.get('x-ratelimit-remaining') || undefined,
        reset: response.headers.get('x-ratelimit-reset') || undefined,
      };

      const retryAfter = response.headers.get('retry-after') || undefined;

      logToConsole(`Response: ${response.status} (${responseTime}ms)`);

      if (rateLimitHeaders.limit || rateLimitHeaders.remaining || rateLimitHeaders.reset) {
        logToConsole('Rate Limit Headers:', rateLimitHeaders);
      }

      if (!response.ok) {
        logToConsole('Error:', data);

        return {
          scenario: scenario.name,
          status: 'error',
          statusCode: response.status,
          error: data.error?.message || JSON.stringify(data),
          responseTime,
          promptLength: prompt.length,
          rateLimitHeaders,
          retryAfter,
        };
      }

      logToConsole('Success:', { model: data.model, usage: data.usage });

      return {
        scenario: scenario.name,
        status: 'success',
        statusCode: response.status,
        responseTime,
        promptLength: prompt.length,
        rateLimitHeaders,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logToConsole('Exception:', error.message);

      return {
        scenario: scenario.name,
        status: 'error',
        error: error.message,
        responseTime,
        promptLength: prompt.length,
      };
    }
  };

  const runSingleTest = async (index: number) => {
    // Update status to running
    setTestResults((prev) =>
      prev.map((result, i) =>
        i === index ? { ...result, status: 'running' as const } : result
      )
    );

    const scenario = TEST_SCENARIOS[index];
    const result = await testPrompt(index, scenario.prompt);

    // Update with result
    setTestResults((prev) =>
      prev.map((r, i) => (i === index ? result : r))
    );
  };

  const runSequentialTest = async (index: number) => {
    // Update status to running
    setTestResults((prev) =>
      prev.map((result, i) =>
        i === index ? { ...result, status: 'running' as const } : result
      )
    );

    logToConsole('Ardışık test başladı - 5 istek art arda');

    let lastResult: TestResult = {
      scenario: TEST_SCENARIOS[index].name,
      status: 'pending',
      promptLength: TEST_SCENARIOS[index].prompt.length,
    };

    for (let i = 0; i < 5; i++) {
      logToConsole(`Ardışık istek ${i + 1}/5`);
      lastResult = await testPrompt(index, TEST_SCENARIOS[index].prompt);

      if (lastResult.status === 'error') {
        logToConsole(`Ardışık test ${i + 1}. istekte başarısız oldu`);
        break;
      }

      // No delay between requests for this test
    }

    // Update with final result
    setTestResults((prev) =>
      prev.map((r, i) => (i === index ? lastResult : r))
    );
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    logToConsole('Tüm testler başlatılıyor...');

    for (let i = 0; i < TEST_SCENARIOS.length - 1; i++) {
      await runSingleTest(i);

      // Wait 2 seconds between tests
      if (i < TEST_SCENARIOS.length - 2) {
        logToConsole('2 saniye bekleniyor...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Run sequential test last
    await runSequentialTest(TEST_SCENARIOS.length - 1);

    logToConsole('Tüm testler tamamlandı');
    setIsRunningAll(false);
  };

  const resetTests = () => {
    setTestResults(
      TEST_SCENARIOS.map((scenario) => ({
        scenario: scenario.name,
        status: 'pending',
        promptLength: scenario.prompt.length,
      }))
    );
    logToConsole('Testler sıfırlandı');
  };

  if (!apiKey) {
    return (
      <View className="flex-1 bg-background p-4 justify-center">
        <View className="bg-destructive/10 border-2 border-destructive rounded-lg p-6">
          <Text className="text-2xl font-bold text-destructive mb-4">
            ⚠️ API Key Bulunamadı
          </Text>
          <Text className="text-base text-foreground mb-2">
            .env dosyasında EXPO_PUBLIC_OPENROUTER_API_KEY tanımlanmamış.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Lütfen .env dosyasına aşağıdaki satırı ekleyin:
          </Text>
          <Text className="text-xs font-mono bg-muted p-2 rounded mt-2">
            EXPO_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
          </Text>
          <Text className="text-sm text-muted-foreground mt-4">
            Sonra uygulamayı yeniden başlatın:
          </Text>
          <Text className="text-xs font-mono bg-muted p-2 rounded mt-2">
            npx expo start --clear
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-3xl font-bold text-foreground mb-2">
          OpenRouter 429 Hata Test
        </Text>
        <Text className="text-sm text-muted-foreground mb-6">
          Farklı prompt uzunluklarıyla rate limit testi
        </Text>

        {testResults.map((result, index) => {
          const scenario = TEST_SCENARIOS[index];
          const isSequentialTest = index === TEST_SCENARIOS.length - 1;

          return (
            <View
              key={index}
              className="bg-card border border-border rounded-lg p-4 mb-4"
            >
              <Text className="text-lg font-semibold text-foreground mb-1">
                {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏸️'}{' '}
                Senaryo {index + 1}: {scenario.name}
              </Text>
              <Text className="text-sm text-muted-foreground mb-3">
                {scenario.description}
              </Text>

              <View className="space-y-2 mb-3">
                <Text className="text-sm text-foreground">
                  <Text className="font-semibold">Durum:</Text>{' '}
                  {result.status === 'running' ? (
                    <Text className="text-yellow-500">Çalışıyor...</Text>
                  ) : result.status === 'success' ? (
                    <Text className="text-green-500">Başarılı</Text>
                  ) : result.status === 'error' ? (
                    <Text className="text-red-500">Hata</Text>
                  ) : (
                    <Text className="text-muted-foreground">Bekliyor</Text>
                  )}
                </Text>

                <Text className="text-sm text-foreground">
                  <Text className="font-semibold">Prompt Uzunluğu:</Text>{' '}
                  {result.promptLength.toLocaleString()} karakter
                </Text>

                {result.statusCode && (
                  <Text className="text-sm text-foreground">
                    <Text className="font-semibold">Status Code:</Text>{' '}
                    <Text
                      className={
                        result.statusCode === 429
                          ? 'text-red-500 font-bold'
                          : result.statusCode === 200
                            ? 'text-green-500'
                            : 'text-foreground'
                      }
                    >
                      {result.statusCode}
                      {result.statusCode === 429 && ' (Rate Limit Exceeded)'}
                    </Text>
                  </Text>
                )}

                {result.responseTime && (
                  <Text className="text-sm text-foreground">
                    <Text className="font-semibold">Response Time:</Text> {result.responseTime}ms
                  </Text>
                )}

                {result.rateLimitHeaders &&
                  (result.rateLimitHeaders.limit ||
                    result.rateLimitHeaders.remaining ||
                    result.rateLimitHeaders.reset) && (
                    <View className="mt-2 bg-muted/50 p-2 rounded">
                      <Text className="text-xs font-semibold text-foreground mb-1">
                        Rate Limit Headers:
                      </Text>
                      {result.rateLimitHeaders.limit && (
                        <Text className="text-xs text-foreground">
                          Limit: {result.rateLimitHeaders.limit}
                        </Text>
                      )}
                      {result.rateLimitHeaders.remaining && (
                        <Text className="text-xs text-foreground">
                          Remaining: {result.rateLimitHeaders.remaining}
                        </Text>
                      )}
                      {result.rateLimitHeaders.reset && (
                        <Text className="text-xs text-foreground">
                          Reset: {new Date(parseInt(result.rateLimitHeaders.reset) * 1000).toLocaleTimeString()}
                        </Text>
                      )}
                    </View>
                  )}

                {result.retryAfter && (
                  <Text className="text-sm text-foreground">
                    <Text className="font-semibold">Retry After:</Text> {result.retryAfter}s
                  </Text>
                )}

                {result.error && (
                  <View className="bg-destructive/10 p-2 rounded mt-2">
                    <Text className="text-xs text-destructive">{result.error}</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() =>
                  isSequentialTest ? runSequentialTest(index) : runSingleTest(index)
                }
                disabled={result.status === 'running' || isRunningAll}
                className={`py-2 px-4 rounded ${result.status === 'running' || isRunningAll
                    ? 'bg-muted'
                    : 'bg-primary'
                  }`}
              >
                {result.status === 'running' ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-primary-foreground ml-2">Çalışıyor...</Text>
                  </View>
                ) : (
                  <Text className="text-primary-foreground text-center font-semibold">
                    Test Et
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}

        <View className="flex-row gap-2 mt-4">
          <Pressable
            onPress={runAllTests}
            disabled={isRunningAll}
            className={`flex-1 py-3 px-4 rounded ${isRunningAll ? 'bg-muted' : 'bg-primary'
              }`}
          >
            {isRunningAll ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-primary-foreground ml-2">Çalışıyor...</Text>
              </View>
            ) : (
              <Text className="text-primary-foreground text-center font-semibold">
                🔄 Tümünü Çalıştır
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={resetTests}
            disabled={isRunningAll}
            className="py-3 px-4 rounded bg-muted"
          >
            <Text className="text-foreground text-center font-semibold">🗑️ Sıfırla</Text>
          </Pressable>
        </View>

        <View className="bg-muted/50 p-4 rounded-lg mt-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            💡 Beklenen Sonuçlar:
          </Text>
          <Text className="text-xs text-muted-foreground mb-1">
            • Token Limit: Senaryo 3-4 başarısız → Prompt çok uzun
          </Text>
          <Text className="text-xs text-muted-foreground mb-1">
            • Rate Limit: Senaryo 5 başarısız → Çok hızlı istek
          </Text>
          <Text className="text-xs text-muted-foreground">
            • Diğer: Rastgele başarısız → API key/model problemi
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}