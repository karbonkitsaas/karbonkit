const SUPABASE_URL = 'https://hcdnbrmepzyzqakvdkkc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZG5icm1lcHp5enFha3Zka2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDkyNjcsImV4cCI6MjA3NDE4NTI2N30.gzDEOvKIKKZHtBndbPUd7TGv40Zsn4QEBfu8d6DSJS4';
document.addEventListener('alpine:init', () => {
    Alpine.data('carbonCalculator', () => ({
        // State
        isAuthenticated: false,
        user: null,
        lang: 'en', // Default language
        currentView: 'dashboard',
        isLoadingData: false,
        showConfirmExport: false,
        runExport: () => {},
        showOnboarding: true,
        showTutorial: false,
        tutorialStep: 1,
        onboarding: {
            step: 1,
            industry: 'Palm Oil',
            exportsToEU: 'No',
            employees: '<50'
        },
        pastCalculations: [],
        pastReports: [],
        dieselEntries: [],
        activeTab: 'manual',
        newEntry: { description: '', liters: 0 },
        errorMessage: '',
        totalLiters: 0,
        co2eTons: 0,
        cbam: {
            exportVolume: 0,
            taxEur: 0,
            taxRmy: 0,
            offsetCost: 0,
            scope3Preview: 0,
            riskScore: { en: 'Low', my: 'Rendah', class: 'risk-low' }
        },
        eudr: {
            geolocation: 'No',
            certification: 'None',
            landUse: 'No Deforestation',
            riskScore: { en: 'High', my: 'Tinggi', class: 'risk-high' },
            mitigation: { en: 'Obtain MSPO certification', my: 'Dapatkan pensijilan MSPO' }
        },
        simulationSummary: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 },
        simulationHistory: [],
        filterRisk: '',
        filterDate: '',
        currentPage: 1,
        pageSize: 10,
        premiumUnlocked: false,
        subscriptionExpiry: null,
        showPaymentSuccess: false,
        vcmCredits: 100,
        vcmPrice: 50,
        vcmTrades: [],

        // Supabase Config
        SUPABASE_URL: 'https://hcdnbrmepzyzqakvdkkc.supabase.co', // Replace with your Supabase URL
        SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZG5icm1lcHp5enFha3Zka2tjIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTg2MDkyNjcsImV4cCI6MjA3NDE4NTI2N30.gzDEOvKIKKZHtBndbPUd7TGv40Zsn4QEBfu8d6DSJS4', // Replace with your Supabase anon key

        // Methods
        async init() {
                this.isLoadingData = true;
                try {
                    await this.fetchCalculations();
                    await this.fetchSimulations();
                    await this.fetchReports();
                    this.initTooltips();
                } catch (error) {
                    this.errorMessage = this.lang === 'en' ? 'Failed to load data' : 'Gagal memuat data';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            setLang(lang) {
                this.lang = lang;
                console.log('Language set to:', lang);
                this.$nextTick(() => {
                    document.documentElement.lang = lang;
                });
            },

            async finishOnboarding() {
                this.showOnboarding = false;
                if (this.onboarding.industry === 'Palm Oil') {
                    this.newEntry.description = 'Palm Oil Milling';
                }
                // Show tutorial after onboarding
                this.showTutorial = true;
                this.tutorialStep = 1;
            },

            nextTutorialStep() {
                if (this.tutorialStep < 3) {
                    this.tutorialStep++;
                } else {
                    this.showTutorial = false;
                    // Save progress to Supabase
                    this.saveUserProgress();
                }
            },

            async saveUserProgress() {
                try {
                    const { error } = await this.supabase
                        .from('user_progress')
                        .upsert({ user_id: this.user.id, tutorial_completed: true });

                    if (error) {
                        console.error('Error saving user progress:', error);
                    }
                } catch (error) {
                    console.error('Unexpected error saving user progress:', error);
                }
            },

            // Initialize Tippy.js tooltips
            initTooltips() {
                tippy('[data-tippy-content]', {
                    theme: 'light',
                    animation: 'fade',
                    duration: 200,
                });
            },

            async addEntry() {
                if (this.newEntry.liters <= 0) {
                    this.errorMessage = this.lang === 'en' ? 'Invalid input: Liters must be positive' : 'Input tidak sah: Liter mesti positif';
                    setTimeout(() => this.errorMessage = '', 3000);
                    return;
                }
                this.isLoadingData = true;
                try {
                    const co2eTons = this.newEntry.liters * 2.68 / 1000; // IPCC 2006/AR5: 2.68 kg CO2e/liter
                    const response = await fetch(`${this.SUPABASE_URL}/rest/v1/emissions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': this.SUPABASE_KEY,
                            'Authorization': `Bearer ${this.SUPABASE_KEY}`
                        },
                        body: JSON.stringify({
                            liters: this.newEntry.liters,
                            co2e_tons: co2eTons
                        })
                    });
                    if (!response.ok) throw new Error('Failed to save entry');
                    this.dieselEntries.push({ ...this.newEntry, co2eTons });
                    this.totalLiters += this.newEntry.liters;
                    this.co2eTons += co2eTons;
                    this.pastCalculations.push({ ...this.newEntry, co2eTons, timestamp: new Date().toISOString() });
                    this.newEntry = { description: '', liters: 0 };
                } catch (error) {
                    this.errorMessage = this.lang === 'en' ? 'Failed to save entry' : 'Gagal menyimpan entri';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            calculateCbam() {
                const CBAM_PRICE_EUR = 100; // Price per ton in EUR
                const EUR_TO_MYR = 5.0; // Conversion rate
                const PHASE_IN_RATE_2026 = 0.025; // Phase-in rate
                const SCOPE_3_CPO_FACTOR = 0.5; // Scope 3 factor
                const VCM_CREDIT_PRICE_MYR = 50; // Offset cost per ton

                this.cbam.taxEur = this.co2eTons * CBAM_PRICE_EUR * PHASE_IN_RATE_2026;
                this.cbam.taxRmy = this.cbam.taxEur * EUR_TO_MYR;
                this.cbam.scope3Preview = (this.cbam.exportVolume * 1000) * SCOPE_3_CPO_FACTOR / 1000;
                this.cbam.offsetCost = this.co2eTons * VCM_CREDIT_PRICE_MYR;

                this.cbam.riskScore = this.cbam.taxRmy > 5000
                    ? { en: 'High', my: 'Tinggi', class: 'risk-high' }
                    : this.cbam.taxRmy < 1000
                    ? { en: 'Low', my: 'Rendah', class: 'risk-low' }
                    : { en: 'Medium', my: 'Sederhana', class: 'risk-medium' };
            },

            calculateEudr() {
                if (this.eudr.geolocation === 'Yes' && this.eudr.certification === 'MSPO/RSPO' && this.eudr.landUse === 'No Deforestation') {
                    this.eudr.riskScore = { en: 'Low', my: 'Rendah', class: 'risk-low' };
                } else {
                    this.eudr.riskScore = { en: 'High', my: 'Tinggi', class: 'risk-high' };
                    this.eudr.mitigation = { en: 'Obtain MSPO certification', my: 'Dapatkan pensijilan MSPO' };
                }
            },

            async saveSimulation() {
                this.isLoadingData = true;
                try {
                    const { error, status } = await this.supabase
                        .from('simulations')
                        .insert({
                            volume: this.cbam.exportVolume,
                            cbam_tax_rm: this.cbam.taxRmy,
                            eudr_risk: this.eudr.riskScore.en,
                            mitigation: this.eudr.mitigation.en
                        });

                    if (error) {
                        if (status === 401 || status === 403) {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Unauthorized access. Please check your permissions.' 
                                : 'Akses tidak dibenarkan. Sila semak kebenaran anda.';
                        } else {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Failed to save simulation.' 
                                : 'Gagal menyimpan simulasi.';
                        }
                        console.error('Error saving simulation:', error);
                    } else {
                        alert(this.lang === 'en' 
                            ? 'Simulation saved successfully!' 
                            : 'Simulasi berjaya disimpan!');
                    }
                } catch (error) {
                    this.errorMessage = this.lang === 'en' 
                        ? 'An unexpected error occurred while saving the simulation.' 
                        : 'Ralat tidak dijangka berlaku semasa menyimpan simulasi.';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            async fetchSimulations() {
                this.isLoadingData = true;
                try {
                    const { data, error, status } = await this.supabase
                        .from('simulations')
                        .select('*')
                        .order('timestamp', { ascending: false });

                    if (error) {
                        if (status === 401 || status === 403) {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Unauthorized access. Please check your permissions.' 
                                : 'Akses tidak dibenarkan. Sila semak kebenaran anda.';
                        } else {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Failed to fetch simulations.' 
                                : 'Gagal mengambil simulasi.';
                        }
                        console.error('Error fetching simulations:', error);
                    } else {
                        this.simulationHistory = data;
                    }
                } catch (error) {
                    this.errorMessage = this.lang === 'en' 
                        ? 'An unexpected error occurred while fetching simulations.' 
                        : 'Ralat tidak dijangka berlaku semasa mengambil simulasi.';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            async fetchCalculations() {
                this.isLoadingData = true;
                try {
                    const { data, error, status } = await this.supabase
                        .from('emissions')
                        .select('*')
                        .order('timestamp', { ascending: false });

                    if (error) {
                        if (status === 401 || status === 403) {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Unauthorized access. Please check your permissions.' 
                                : 'Akses tidak dibenarkan. Sila semak kebenaran anda.';
                        } else {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Failed to fetch calculations.' 
                                : 'Gagal mengambil pengiraan.';
                        }
                        console.error('Error fetching calculations:', error);
                    } else {
                        this.pastCalculations = data;
                    }
                } catch (error) {
                    this.errorMessage = this.lang === 'en' 
                        ? 'An unexpected error occurred while fetching calculations.' 
                        : 'Ralat tidak dijangka berlaku semasa mengambil pengiraan.';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            async fetchReports() {
                this.isLoadingData = true;
                try {
                    const { data, error, status } = await this.supabase
                        .from('reports')
                        .select('*')
                        .order('timestamp', { ascending: false });

                    if (error) {
                        if (status === 401 || status === 403) {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Unauthorized access. Please check your permissions.' 
                                : 'Akses tidak dibenarkan. Sila semak kebenaran anda.';
                        } else {
                            this.errorMessage = this.lang === 'en' 
                                ? 'Failed to fetch reports.' 
                                : 'Gagal mengambil laporan.';
                        }
                        console.error('Error fetching reports:', error);
                    } else {
                        this.pastReports = data;
                    }
                } catch (error) {
                    this.errorMessage = this.lang === 'en' 
                        ? 'An unexpected error occurred while fetching reports.' 
                        : 'Ralat tidak dijangka berlaku semasa mengambil laporan.';
                    console.error(error);
                } finally {
                    this.isLoadingData = false;
                }
            },

            trends: {
                cbam: { en: '', my: '' },
                eudr: { en: '', my: '' }
            },

            async calculateTrends() {
                try {
                    // Calculate CBAM tax trend
                    const avgCo2eTons = this.pastCalculations.reduce((sum, calc) => sum + calc.co2eTons, 0) / this.pastCalculations.length;
                    const cbamTaxIncrease = avgCo2eTons * 200; // RM200/month if emissions rise 10%
                    this.trends.cbam.en = `Projected CBAM tax increase: RM${cbamTaxIncrease.toFixed(2)}/month`;
                    this.trends.cbam.my = `Anggaran kenaikan cukai CBAM: RM${cbamTaxIncrease.toFixed(2)}/bulan`;

                    // Forecast EUDR risk
                    const highRiskSimulations = this.simulationHistory.filter(sim => sim.eudr_risk === 'High');
                    const highRiskPercentage = (highRiskSimulations.length / this.simulationHistory.length) * 100;
                    this.trends.eudr.en = highRiskPercentage > 50
                        ? 'High risk for 2026 without geolocation and certification.'
                        : 'Low risk for 2026 with current measures.';
                    this.trends.eudr.my = highRiskPercentage > 50
                        ? 'Risiko tinggi untuk 2026 tanpa geolokasi dan pensijilan.'
                        : 'Risiko rendah untuk 2026 dengan langkah semasa.';

                    // Save insights to Supabase
                    const { error } = await this.supabase.from('insights').insert({
                        cbam_trend: this.trends.cbam.en,
                        eudr_forecast: this.trends.eudr.en,
                        timestamp: new Date().toISOString()
                    });

                    if (error) {
                        console.error('Error saving insights:', error);
                    }
                } catch (error) {
                    console.error('Error calculating trends:', error);
                }
            },

            async scanBill(event) {
                this.errorMessage = '';
                const file = event.target.files[0];
                if (!file) {
                    this.errorMessage = this.lang === 'en' ? 'No file selected.' : 'Tiada fail dipilih.';
                    return;
                }
                // Only allow .pdf, .jpg, .png
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
                if (!allowedTypes.includes(file.type)) {
                    this.errorMessage = this.lang === 'en' ? 'Invalid file type.' : 'Jenis fail tidak sah.';
                    return;
                }
                this.isLoadingData = true;
                try {
                    // Use Tesseract.js for OCR (mock 90% accuracy)
                    let extractedLiters = null;
                    if (window.Tesseract) {
                        const result = await window.Tesseract.recognize(file, 'eng');
                        // Mock extraction: look for a number followed by 'L' or 'liters'
                        const match = result.data.text.match(/(\d+[.,]?\d*)\s*(L|liters)/i);
                        if (match) {
                            extractedLiters = parseFloat(match[1]) * 0.9; // mock 90% accuracy
                        }
                    }
                    // Fallback to ILMU API if available
                    if (!extractedLiters && window.ILMU_API) {
                        const apiResult = await window.ILMU_API.extractLiters(file);
                        if (apiResult && apiResult.liters) {
                            extractedLiters = apiResult.liters;
                        }
                    }
                    if (!extractedLiters) {
                        this.errorMessage = this.lang === 'en' ? 'Could not extract liters from bill.' : 'Tidak dapat mengekstrak liter dari bil.';
                        return;
                    }
                    this.newEntry.liters = extractedLiters;
                    this.newEntry.description = file.name;
                    // Calculate CO2e
                    const co2eTons = extractedLiters * 2.68 / 1000;
                    // Store in Supabase invoices table
                    const { error } = await this.supabase.from('invoices').insert({
                        filename: file.name,
                        liters: extractedLiters,
                        co2e_tons: co2eTons,
                        timestamp: new Date().toISOString()
                    });
                    if (error) {
                        this.errorMessage = this.lang === 'en' ? 'Failed to save invoice.' : 'Gagal menyimpan invois.';
                    }
                } catch (err) {
                    this.errorMessage = this.lang === 'en' ? 'Error scanning bill.' : 'Ralat semasa mengimbas bil.';
                } finally {
                    this.isLoadingData = false;
                }
            },

            async fetchCredits() {
                this.isLoadingData = true;
                try {
                    // Mock fetch: set credits to 100
                    this.vcmCredits = 100;
                    // Optionally fetch trades from Supabase
                    const { data, error } = await this.supabase.from('vcm_trades').select('*').order('timestamp', { ascending: false });
                    if (!error) {
                        this.vcmTrades = data;
                    }
                } catch (err) {
                    this.errorMessage = this.lang === 'en' ? 'Error fetching credits.' : 'Ralat mengambil kredit.';
                } finally {
                    this.isLoadingData = false;
                }
            },

            async buyCredits(tons) {
                this.errorMessage = '';
                if (!tons || tons <= 0 || tons > this.vcmCredits) {
                    this.errorMessage = this.lang === 'en' ? 'Invalid amount.' : 'Jumlah tidak sah.';
                    return;
                }
                this.isLoadingData = true;
                const cost = tons * this.vcmPrice;
                try {
                    const { error } = await this.supabase.from('vcm_trades').insert({
                        tons,
                        cost_rm: cost,
                        timestamp: new Date().toISOString()
                    });
                    if (error) {
                        this.errorMessage = this.lang === 'en' ? 'Purchase failed.' : 'Pembelian gagal.';
                    } else {
                        this.vcmCredits -= tons;
                        this.vcmTrades.unshift({ tons, cost_rm: cost, timestamp: new Date().toISOString() });
                        alert(this.lang === 'en' ? 'Purchase successful!' : 'Pembelian berjaya!');
                    }
                } catch (err) {
                    this.errorMessage = this.lang === 'en' ? 'Error during purchase.' : 'Ralat semasa pembelian.';
                } finally {
                    this.isLoadingData = false;
                }
            },

            async checkSubscription() {
                this.isLoadingData = true;
                try {
                    const { data, error } = await this.supabase.from('subscriptions').select('*').order('expiry', { ascending: false }).limit(1);
                    if (!error && data && data.length > 0) {
                        const sub = data[0];
                        this.premiumUnlocked = sub.status === 'active' && new Date(sub.expiry) > new Date();
                        this.subscriptionExpiry = sub.expiry;
                    } else {
                        this.premiumUnlocked = false;
                        this.subscriptionExpiry = null;
                    }
                } catch (err) {
                    this.errorMessage = this.lang === 'en' ? 'Error checking subscription.' : 'Ralat semak langganan.';
                } finally {
                    this.isLoadingData = false;
                }
            },

            async subscribe() {
                this.isLoadingData = true;
                try {
                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + 1);
                    const { error } = await this.supabase.from('subscriptions').insert({
                        status: 'active',
                        expiry: expiry.toISOString()
                    });
                    // Check for error after insert
                    if (error) {
                        this.errorMessage = this.lang === 'en' ? 'Subscription failed.' : 'Langganan gagal.';
                    } else {
                        this.premiumUnlocked = true;
                        this.subscriptionExpiry = expiry.toISOString();
                        this.showPaymentSuccess = true;
                        setTimeout(() => this.showPaymentSuccess = false, 3000);
                        alert(this.lang === 'en' ? 'Subscription successful!' : 'Langganan berjaya!');
                    }
                } catch (err) {
                    this.errorMessage = this.lang === 'en' ? 'Error during subscription.' : 'Ralat semasa langganan.';
                } finally {
                    this.isLoadingData = false;
                }
            },
    }));
});