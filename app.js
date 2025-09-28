document.addEventListener('alpine:init', () => {
    Alpine.data('carbonCalculator', () => ({
        // --- STATE VARIABLES ---
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
            { name_en: 'Reforestation on Palm Estate (per hectare)', name_my: 'Penanaman Semula Hutan di Estet Sawit (per hektar)', creditsPerHectare: 10 },
        ],
        chatbotOpen: false,
        chatHistory: [],
        feedbackModalOpen: false,
        feedbackSubmitted: false,
        feedback: { easeOfUse: '5', reportClarity: '5', vcmValue: '5', mobileExperience: '5', cbamReadiness: '5', recommendScore: '10', featureRequests: '' },
        extractedLitersPreview: null,
        supabase: null,
        
        // Simulators State
        cbam: {
            exportVolume: 100,
            product: 'CPO',
            taxEur: 0,
            taxRmy: 0,
            scope3Preview: 0,
            riskScore: { en: 'Low', my: 'Rendah', class: 'risk-low' },
            offsetCost: 0
        },
        eudr: {
            geolocation: 'Yes',
            certification: 'MSPO/RSPO',
            landUse: 'No Deforestation',
            riskScore: { en: 'Low', my: 'Rendah', class: 'risk-low' },
            mitigation: { en: 'Compliance likely. Maintain records.', my: 'Pematuhan berkemungkinan. Simpan rekod.'}
        },
        
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
            
            if (!supabaseUrl.startsWith('http')) {
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
            console.log(`Mock parsing file: ${file.name}`);
            setTimeout(() => {
                this.extractedLitersPreview = {
                    description: file.name,
                    liters: parseFloat((Math.random() * 2000 + 500).toFixed(2))
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
        },
        
        async fetchCalculations() {
            this.isLoadingData = true;
            const { data, error } = await this.supabase.from('emissions').select('*').order('timestamp', { ascending: false });
            if (!error) { this.pastCalculations = data; }
            this.isLoadingData = false;
        },

        calculateCbam() {
            const CBAM_PRICE_EUR = 100; const EUR_TO_MYR = 5.0; const PHASE_IN_RATE_2026 = 0.025;
            const SCOPE_3_CPO_FACTOR = 0.5; const VCM_CREDIT_PRICE_MYR = 50;
            this.cbam.taxEur = this.co2eTons * CBAM_PRICE_EUR * PHASE_IN_RATE_2026;
            this.cbam.taxRmy = this.cbam.taxEur * EUR_TO_MYR;
            this.cbam.scope3Preview = (this.cbam.exportVolume * 1000) * SCOPE_3_CPO_FACTOR / 1000;
            this.cbam.offsetCost = this.co2eTons * VCM_CREDIT_PRICE_MYR;
            if (this.cbam.taxRmy > 5000) this.cbam.riskScore = { en: 'High', my: 'Tinggi', class: 'risk-high' };
            else if (this.cbam.taxRmy > 1000) this.cbam.riskScore = { en: 'Medium', my: 'Sederhana', class: 'risk-medium' };
            else this.cbam.riskScore = { en: 'Low', my: 'Rendah', class: 'risk-low' };
        },

        calculateEudr() {
            if (this.eudr.landUse === 'Deforestation') {
                this.eudr.riskScore = { en: 'High', my: 'Tinggi', class: 'risk-high' };
                this.eudr.mitigation = { en: 'Action required: Land used post-2020 involved deforestation.', my: 'Tindakan diperlukan: Penggunaan tanah selepas 2020 melibatkan penebangan hutan.' };
            } else if (this.eudr.certification === 'MSPO/RSPO' && this.eudr.geolocation === 'Yes') {
                this.eudr.riskScore = { en: 'Low', my: 'Rendah', class: 'risk-low' };
                this.eudr.mitigation = { en: 'Compliance likely. Maintain records.', my: 'Pematuhan berkemungkinan. Simpan rekod.' };
            } else if (this.eudr.certification === 'MSPO/RSPO' && this.eudr.geolocation === 'No') {
                this.eudr.riskScore = { en: 'Medium', my: 'Sederhana', class: 'risk-medium' };
                this.eudr.mitigation = { en: 'Mitigation: Add plot geolocation data to lower risk (Cost: RM0).', my: 'Mitigasi: Tambah data geolokasi plot untuk kurangkan risiko (Kos: RM0).' };
            } else {
                this.eudr.riskScore = { en: 'High', my: 'Tinggi', class: 'risk-high' };
                this.eudr.mitigation = { en: 'Mitigation: Obtain MSPO/RSPO certification and provide geolocation data.', my: 'Mitigasi: Dapatkan pensijilan MSPO/RSPO dan sediakan data geolokasi.' };
            }
        },

        async saveSimulation() {
            const { error } = await this.supabase.from('simulations').insert({
                volume: this.cbam.exportVolume,
                cbam_tax_rm: this.cbam.taxRmy,
                eudr_risk: this.eudr.riskScore.en,
                mitigation: this.eudr.mitigation.en
            });
            if (error) { alert("Failed to save simulation."); console.error(error); }
            else { alert("Simulation saved!"); }
        },

        mockPayment() {
            this.isLoading = true;
            setTimeout(() => {
                this.premiumUnlocked = true; this.showPaymentSuccess = true; this.isLoading = false;
            }, 1500);
        },
        
        get jsonForBi() {
            return JSON.stringify({ liters: this.totalLiters, co2e_tons: this.co2eTons }, null, 2);
        },
        
        exportVcmCSV() { 
            if (this.totalLiters <= 0) return;
             let csvContent = "data:text/csv;charset=utf-8,action,credits_generated,value_rm\n";
             this.vcmActions.forEach(action => {
                 const credits = (this.co2eTons * (action.percentage || 0)).toFixed(5);
                 const value = (credits * 50).toFixed(2);
                 const name = this.lang === 'my' ? action.name_my : action.name_en;
                 csvContent += `${name},${credits},${value}\n`;
             });
             window.open(encodeURI(csvContent));
        },
        
        askQuestion(question) {
            const faq = this.faqs[this.lang].find(f => f.q === question);
            if (faq) {
                this.chatHistory.push({ type: 'user', text: faq.q });
                setTimeout(() => this.chatHistory.push({ type: 'bot', text: faq.a }), 300);
            }
        },
        
        async submitFeedback() {
            const { error } = await this.supabase.from('feedback').insert({ responses: this.feedback });
            if (error) { console.error("Feedback error:", error); alert("Failed to submit feedback.");}
            else { this.feedbackSubmitted = true; }
        },

        exportCbamJson() {
            // Export CBAM simulation as JSON
            const cbamData = {
                co2e: this.co2eTons,
                tax_eur: this.cbam.taxEur,
                tax_rm: this.cbam.taxRmy,
                scope3: this.cbam.scope3Preview,
                risk: this.cbam.riskScore.en,
                offset_cost: this.cbam.offsetCost
            };
            const blob = new Blob([JSON.stringify(cbamData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cbam_simulation.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        exportEudrJson() {
            // Export EUDR mitigation as JSON
            const eudrData = {
                geolocation: this.eudr.geolocation,
                certification: this.eudr.certification,
                land_use: this.eudr.landUse,
                risk: this.eudr.riskScore.en,
                mitigation: this.eudr.mitigation.en
            };
            const blob = new Blob([JSON.stringify(eudrData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'eudr_mitigation.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        generatePDF(type = 'free') {
            if (this.dieselEntries.length === 0) {
                this.reportErrorMessage = "Please add at least one diesel entry.";
                return;
            }
            // Premium report logic with jsPDF
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
            if (type === 'premium') {
                doc.setFontSize(14);
                doc.setTextColor(255, 140, 0);
                doc.text("Premium SEDG Report (Paid)", 15, y);
                y += 10;
                doc.setTextColor(0,0,0);
                doc.setFontSize(12);
                doc.text("Sponsor:", 15, y);
                doc.rect(40, y-5, 30, 15);
                doc.text("[Logo]", 45, y+5);
                y += 20;
            }
            doc.setFontSize(11);
            doc.text("Entries:", 15, y);
            y += 7;
            this.dieselEntries.forEach((entry, idx) => {
                doc.text(`${idx+1}. ${entry.description}: ${entry.liters} L`, 18, y);
                y += 6;
            });
            // Store report in Supabase
            if (type === 'premium') {
                this.mockPayment();
                setTimeout(async () => {
                    await this.supabase.from('reports').insert({
                        report_type: type,
                        timestamp: new Date().toISOString()
                    });
                    doc.save(`SEDG_Report_${type}_${new Date().toISOString().slice(0,10)}.pdf`);
                }, 1600);
            } else {
                doc.save(`SEDG_Report_${type}_${new Date().toISOString().slice(0,10)}.pdf`);
            }
        }
    }));
});

