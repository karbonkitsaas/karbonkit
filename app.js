document.addEventListener('alpine:init', () => {
    Alpine.data('carbonCalculator', () => ({
        // All state variables
        lang: 'en',
        currentView: 'calculator',
        isLoadingData: true,
        pastCalculations: [],
        dieselEntries: [],
        activeTab: 'manual',
        newEntry: { description: 'Diesel for Tractor', liters: null },
        errorMessage: '',
        totalLiters: 0,
        co2eTons: 0,
        showOnboarding: true,
        onboarding: { step: 1, industry: 'Palm Oil', exportsToEU: 'Yes', employees: '<50' },
        report: { companyName: '', reportingPeriod: new Date().toISOString().slice(0, 7) },
        reportErrorMessage: '',
        reportType: 'free',
        premiumUnlocked: false,
        showPaymentSuccess: false,
        vcmActions: [
            { name_en: 'Switch to B20 Biodiesel', name_my: 'Tukar kepada Biodiesel B20', percentage: 0.20 },
            { name_en: 'Reforestation on Palm Estate', name_my: 'Penanaman Semula Hutan di Estet Sawit', percentage: 0.15 },
        ],
        chatbotOpen: false,
        chatHistory: [],
        feedbackModalOpen: false,
        feedbackSubmitted: false,
        feedback: { easeOfUse: '5', reportClarity: '5', vcmValue: '5', mobileExperience: '5', cbamReadiness: '5', recommendScore: '10', featureRequests: '' },
        extractedLitersPreview: null,
        
        // Supabase Client
        supabase: null,
        
        // All FAQs
        faqs: {
            en: [
                { q: 'What is Scope 1?', a: '<strong>Scope 1 emissions</strong> are direct GHG emissions from sources an organization owns or controls, like fuel in vehicles.' },
                { q: 'How to calculate diesel emissions?', a: 'The calculation is: <br><strong>Liters of Diesel × 2.68 kg CO2e/liter ÷ 1000 = tons of CO2e</strong>.' },
                { q: 'What is SEDG 2025?', a: 'The <strong>Simplified ESG Disclosure Guide (SEDG)</strong> by Bursa Malaysia is a framework for SMEs to report ESG data, becoming mandatory for many in 2025.' },
                { q: 'What is the EU CBAM?', a: 'The EU\'s Carbon Border Adjustment Mechanism (CBAM) is a carbon price on imports. From 2026, EU buyers will need emissions data from their Malaysian suppliers.' },
                { q: 'What are carbon credits?', a: 'A carbon credit is a tradable permit representing one ton of CO2e reduced or removed from the atmosphere.' },
                { q: 'How to reduce diesel emissions?', a: 'Key strategies for palm oil SMEs: <br>1. <strong>Switch to Palm Biodiesel (B30)</strong> <br>2. <strong>Optimize FFB Transport Routes</strong> <br>3. <strong>Regular Machinery Maintenance</strong> <br>4. <strong>Methane Capture from POME</strong>' },
                { q: 'What is a POME project?', a: 'A Palm Oil Mill Effluent (POME) project involves capturing methane from wastewater ponds, reducing emissions and generating carbon credits.' },
                { q: 'How to submit to Bursa VCM?', a: 'To sell carbon credits, your reduction project must be validated and verified by an accredited third-party body, then registered on the Bursa VCM exchange.' },
                { q: 'Why is an audit trail important?', a: 'An audit trail provides a verifiable record of your data, crucial for SEDG and CBAM compliance to prove the accuracy of your emissions reporting.'},
                { q: 'Who verifies reductions?', a: 'For your reductions to be eligible as carbon credits, they must be audited by an <strong>independent, accredited verifier</strong> to ensure they are real, permanent, and additional.' }
            ],
            my: [
                { q: 'Apa itu Skop 1?', a: '<strong>Pelepasan Skop 1</strong> adalah pelepasan GHG langsung dari sumber yang dimiliki atau dikawal oleh syarikat, seperti bahan api dalam kenderaan.' },
                { q: 'Bagaimana kira pelepasan diesel?', a: 'Pengiraannya ialah: <br><strong>Liter Diesel × 2.68 kg CO2e/liter ÷ 1000 = tan CO2e</strong>.' },
                { q: 'Apakah itu SEDG 2025?', a: '<strong>Panduan Pendedahan ESG Dipermudahkan (SEDG)</strong> oleh Bursa Malaysia ialah rangka kerja untuk PKS melaporkan data ESG, yang akan menjadi mandatori bagi ramai pada tahun 2025.' },
                { q: 'Apakah itu CBAM EU?', a: 'Mekanisme Penyelarasan Sempadan Karbon (CBAM) EU ialah harga karbon ke atas import. Mulai 2026, pembeli EU memerlukan data pelepasan daripada pembekal Malaysia mereka.' },
                { q: 'Apakah itu kredit karbon?', a: 'Kredit karbon ialah permit boleh dagang yang mewakili satu tan CO2e yang dikurangkan atau disingkirkan dari atmosfera.' },
                { q: 'Bagaimana kurangkan pelepasan diesel?', a: 'Strategi utama untuk PKS sawit: <br>1. <strong>Tukar kepada Biodiesel Sawit (B30)</strong> <br>2. <strong>Optimumkan Laluan Pengangkutan BTS</strong> <br>3. <strong>Penyelenggaraan Jentera Berkala</strong> <br>4. <strong>Pemerangkapan Metana dari POME</strong>' },
                { q: 'Apakah projek POME?', a: 'Projek Efluen Kilang Minyak Sawit (POME) melibatkan pemerangkapan metana dari kolam air sisa, mengurangkan pelepasan dan menjana kredit karbon.' },
                { q: 'Bagaimana hantar ke Bursa VCM?', a: 'Untuk menjual kredit karbon, projek pengurangan anda mesti disahkan oleh badan pihak ketiga yang bertauliah, kemudian didaftarkan di bursa VCM Bursa.' },
                { q: 'Mengapa jejak audit penting?', a: 'Jejak audit menyediakan rekod data anda yang boleh disahkan, penting untuk pematuhan SEDG dan CBAM bagi membuktikan ketepatan pelaporan pelepasan anda.'},
                { q: 'Siapa yang sahkan pengurangan?', a: 'Agar pengurangan anda layak sebagai kredit karbon, ia mesti diaudit oleh <strong>pengesah bebas yang bertauliah</strong> untuk memastikan ia benar, kekal dan tambahan.' }
            ]
        },

        // --- METHODS ---
        
        init() {
            this.setLang(navigator.language.startsWith('ms') ? 'my' : 'en');
            
            const supabaseUrl = 'https://hcdnbrmepzyzqakvdkkc.supabase.co';
            const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZG5icm1lcHp5enFha3Zka2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDkyNjcsImV4cCI6MjA3NDE4NTI2N30.gzDEOvKIKKZHtBndbPUd7TGv40Zsn4QEBfu8d6DSJS4';
            
            if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
                console.warn("Supabase credentials not set.");
                this.isLoadingData = false;
                return;
            }
            
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            this.fetchCalculations();
        },

        setLang(language) { this.lang = language; },
        finishOnboarding() { this.showOnboarding = false; if (this.onboarding.industry === 'Palm Oil') { this.newEntry.description = 'Diesel for FFB Tractor'; } },
        
        updateTotals() {
            this.totalLiters = this.dieselEntries.reduce((sum, entry) => sum + (entry.liters || 0), 0);
            this.co2eTons = (this.totalLiters * 2.68) / 1000;
        },
        addEntry() {
            const liters = parseFloat(this.newEntry.liters);
            if (!this.newEntry.description.trim() || isNaN(liters) || liters <= 0) {
                this.errorMessage = this.lang === 'my' ? 'Input tidak sah. Sila masukkan keterangan dan nombor positif untuk liter.' : 'Invalid input. Please enter a description and a positive number for liters.';
                return;
            }
            this.dieselEntries.push({ ...this.newEntry, id: Date.now() });
            this.newEntry.liters = null;
            this.errorMessage = '';
            this.updateTotals();
        },
        removeEntry(index) { this.dieselEntries.splice(index, 1); this.updateTotals(); },
        
        handleFileUpload(event) {
            this.errorMessage = '';
            this.extractedLitersPreview = null;
            const file = event.target.files[0];
            if (!file) return;
            // Mock Gemini Parsing
            console.log(`Mock parsing file: ${file.name}`);
            setTimeout(() => {
                this.extractedLitersPreview = {
                    description: file.name,
                    liters: parseFloat((Math.random() * 2000 + 500).toFixed(2)) // Random value ~90% accuracy
                };
            }, 1000);
        },
        acceptPreview() {
            this.dieselEntries.push({ ...this.extractedLitersPreview, id: Date.now() });
            this.extractedLitersPreview = null;
            this.activeTab = 'manual';
            this.updateTotals();
        },
        
        async saveCalculation() {
            if (this.totalLiters <= 0) return;
            const { error } = await this.supabase.from('emissions').insert({ liters: this.totalLiters, co2e_tons: this.co2eTons });
            if (error) { console.error("Supabase error:", error); alert("Failed to save data."); }
            else { alert("Calculation saved!"); this.fetchCalculations(); }
            this.logAnalyticsEvent('save_calculation', { co2e: this.co2eTons });
        },
        
        async fetchCalculations() {
          this.isLoadingData = true;
          // Optimize for 3G: fetch only last 20 records
          const { data, error } = await this.supabase.from('emissions').select('*').order('timestamp', { ascending: false }).limit(20);
          if (!error) { this.pastCalculations = data; }
          this.isLoadingData = false;
        },

        async generatePDF() {
            if (this.dieselEntries.length === 0) {
                this.reportErrorMessage = "Please add at least one diesel entry to generate a report.";
                return;
            }
            // Prepare report content
            let doc = new window.jspdf.jsPDF();
            let y = 20;
            doc.setFontSize(18);
            doc.text("SEDG Scope 1 Emissions Report", 15, y);
            y += 10;
            doc.setFontSize(12);
            doc.text(`Company: ${this.report.companyName || 'N/A'}`, 15, y);
            y += 8;
            doc.text(`Reporting Period: ${this.report.reportingPeriod}`, 15, y);
            y += 8;
            doc.text(`Total Diesel: ${this.totalLiters} L`, 15, y);
            y += 8;
            doc.text(`Total CO2e: ${this.co2eTons.toFixed(3)} tons`, 15, y);
            y += 8;
            if (this.reportType === 'premium') {
                doc.setFontSize(14);
                doc.setTextColor(255, 140, 0);
                doc.text("Premium SEDG Report (Paid)", 15, y);
                y += 10;
                doc.setTextColor(0,0,0);
                doc.setFontSize(12);
                doc.text("Sponsor:", 15, y);
                // Sponsor logo placeholder (rectangle)
                doc.rect(40, y-5, 30, 15);
                doc.text("[Logo]", 45, y+5);
                y += 20;
            }
            // List entries
            doc.setFontSize(11);
            doc.text("Entries:", 15, y);
            y += 7;
            this.dieselEntries.forEach((entry, idx) => {
                doc.text(`${idx+1}. ${entry.description}: ${entry.liters} L`, 18, y);
                y += 6;
            });
            // Save to Supabase reports table
            try {
                await this.supabase.from('reports').insert({
                    report_type: this.reportType,
                    timestamp: new Date().toISOString()
                });
            } catch (e) { console.error('Supabase report save error', e); }
            doc.save(`SEDG_Report_${this.reportType}_${new Date().toISOString().slice(0,10)}.pdf`);
            this.logAnalyticsEvent('generate_report', { type: this.reportType });
        },
        
        mockPayment() {
            this.isLoading = true;
            setTimeout(() => {
                this.premiumUnlocked = true;
                this.showPaymentSuccess = true;
                this.isLoading = false;
            }, 1500);
        },
        
        get jsonForBi() {
            return JSON.stringify({
                fuel_type: "diesel",
                liters: this.totalLiters,
                co2e_tons: this.co2eTons
            }, null, 2);
        },

        async exportInsightsJSON() {
            // Anonymized data insights for Looker
            const { data, error } = await this.supabase.rpc('get_emissions_insights');
            if (error) {
                alert('Failed to fetch insights');
                return;
            }
            // data: { avg_co2e_tons, count }
            const insights = {
                avg_co2e_tons: data.avg_co2e_tons,
                count: data.count
            };
            const blob = new Blob([JSON.stringify(insights, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'anonymized_insights.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.logAnalyticsEvent('export_insights_json');
        },
        
        exportVcmCSV() {
             if (this.totalLiters <= 0) return;
             let csvContent = "data:text/csv;charset=utf-8,action,credits,value_rm\n";
             this.vcmActions.forEach(action => {
                 const credits = (this.co2eTons * action.percentage).toFixed(5);
                 const value = (credits * 50).toFixed(2);
                 const name = this.lang === 'my' ? action.name_my : action.name_en;
                 csvContent += `${name},${credits},${value}\n`;
             });
             window.open(encodeURI(csvContent));
             this.logAnalyticsEvent('export_vcm_csv');
        },
        
        askQuestion(question) {
            const faq = this.faqs[this.lang].find(f => f.q === question);
            if (faq) {
                this.chatHistory.push({ type: 'user', text: faq.q });
                setTimeout(() => this.chatHistory.push({ type: 'bot', text: faq.a }), 300);
                this.logAnalyticsEvent('chatbot_query', { question: faq.q });
            }
        },
        
        async submitFeedback() {
            const { error } = await this.supabase.from('feedback').insert({ responses: this.feedback });
            if (error) { console.error("Feedback error:", error); alert("Failed to submit feedback.");}
            else { this.feedbackSubmitted = true; }
            this.logAnalyticsEvent('submit_feedback', { rating: this.feedback.recommendScore });
        },

        async logAnalyticsEvent(eventName, details = {}) {
            // Mock logging to Supabase
            console.log(`ANALYTICS: ${eventName}`, details);
            // In a real scenario, you'd insert into a Supabase 'analytics' table.
            // await this.supabase.from('analytics').insert({ event_name: eventName, details: details });
        }
    }));
});
