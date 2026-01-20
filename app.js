// app.js - COMPLETE FIXED FRONTEND FOR INTIZARUL IMAMUL MUNTAZAR
// VERSION: 6.0.1 - SIMPLIFIED LOGIN FIX APPLIED
// LAST UPDATED: 2024

const CONFIG = {
  API_URL: localStorage.getItem('iim_api_url') || 'https://script.google.com/macros/s/AKfycbyTOg9VXDLayr8Xrs3t6hjmKU6TFJDFlUCkQVTpbbgLIqdd2cnWvCR2p_4kLYOFj_9b9w/exec',
  MAX_PHOTO_SIZE: 2 * 1024 * 1024,
  SESSION_TIMEOUT: 30 * 60 * 1000,
  REQUEST_TIMEOUT: 30000
};

const ZONES = {
  'SOKOTO': ['Sokoto', 'Mafara', 'Yaure', 'Illela', 'Zuru', 'Yabo'],
  'KADUNA': ['Kaduna', 'Jaji', 'Mjos'],
  'ABUJA': ['Maraba', 'Lafia', 'Keffi/Doma', 'Minna', 'Suleja'],
  'ZARIA': ['Zaria', 'Danja', 'Dutsen Wai', 'Kudan', 'Soba'],
  'KANO': ['Kano', 'Kazaure', 'Potiskum', 'Gashuwa'],
  'BAUCHI': ['Bauchi', 'Gombe', 'Azare', 'Jos'],
  'MALUMFASHI': ['Malumfashi', 'Bakori', 'Katsina'],
  'NIGER': ['Niyame', 'Maradi'],
  'QUM': ['Qum']
};

const LEVELS = ['Bakiyatullah', 'Ansarullah', 'Ghalibun', 'Graduate'];

class App {
  static async init() {
    console.log('🚀 App initializing...');
    
    try {
      // Setup API URL
      await this.setupApiUrl();
      
      this.setupErrorHandling();
      this.validateSession();
      this.setupGlobalEvents();
      this.loadCurrentPage();
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.error('Failed to initialize application. Please refresh the page.');
    }
  }

  static async setupApiUrl() {
    const savedUrl = localStorage.getItem('iim_api_url');
    
    if (savedUrl && savedUrl !== 'undefined' && savedUrl !== 'null') {
      CONFIG.API_URL = savedUrl;
      console.log('🌐 Using saved API URL:', savedUrl);
      return;
    }
    
    if (CONFIG.API_URL && !CONFIG.API_URL.includes('YOUR_NEW_GAS_WEB_APP_URL')) {
      localStorage.setItem('iim_api_url', CONFIG.API_URL);
      return;
    }
    
    await this.showApiConfigModal();
  }

  static async showApiConfigModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'config-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
      `;
      
      const defaultUrl = 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec';
      
      modal.innerHTML = `
        <div class="config-modal-content" style="
          background: white;
          padding: 30px;
          border-radius: 15px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <h2 style="margin: 0 0 20px 0; color: #228B22; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-cogs"></i> Backend Configuration
          </h2>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
            Please enter your Google Apps Script Web App URL. This is required for the system to work.
          </p>
          
          <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Backend URL:</label>
            <input type="text" id="apiUrlInput" 
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;"
                   value="${defaultUrl}" 
                   placeholder="https://script.google.com/macros/s/.../exec">
          </div>
          
          <div class="info-box" style="
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #228B22;
          ">
            <strong style="display: block; margin-bottom: 10px; color: #333;">How to get this URL:</strong>
            <ol style="margin: 0; padding-left: 20px; color: #666;">
              <li>Deploy your Google Script as Web App</li>
              <li>Select "Execute as: Me" and "Who has access: Anyone"</li>
              <li>Copy the provided URL</li>
              <li>Paste it above</li>
            </ol>
          </div>
          
          <div class="config-modal-buttons" style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="testConnectionBtn" style="
              flex: 1;
              padding: 12px;
              background: #17a2b8;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <i class="fas fa-plug"></i> Test Connection
            </button>
            <button id="saveUrlBtn" style="
              flex: 1;
              padding: 12px;
              background: #228B22;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <i class="fas fa-save"></i> Save & Continue
            </button>
          </div>
          
          <div id="testResult" style="display: none;"></div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('testConnectionBtn').addEventListener('click', async () => {
        const url = document.getElementById('apiUrlInput').value.trim();
        if (!url) {
          this.error('Please enter a URL');
          return;
        }
        
        const resultDiv = document.getElementById('testResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="padding: 10px; background: #f8f9fa; border-radius: 5px; text-align: center; color: #666;"><i class="fas fa-sync fa-spin"></i> Testing connection...</div>';
        
        try {
          const response = await fetch(url, { 
            method: 'GET',
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              resultDiv.innerHTML = `
                <div style="padding: 10px; background: #d4edda; border-radius: 5px; color: #155724;">
                  <i class="fas fa-check-circle"></i> Connection successful!
                  <div style="margin-top: 5px; font-size: 14px;">System: ${data.system || 'System'}, Version: ${data.version || '1.0'}</div>
                </div>
              `;
            } else {
              resultDiv.innerHTML = `
                <div style="padding: 10px; background: #f8d7da; border-radius: 5px; color: #721c24;">
                  <i class="fas fa-exclamation-triangle"></i> Backend error: ${data.message || 'Unknown error'}
                </div>
              `;
            }
          } else {
            resultDiv.innerHTML = `
              <div style="padding: 10px; background: #f8d7da; border-radius: 5px; color: #721c24;">
                <i class="fas fa-times-circle"></i> HTTP ${response.status}: ${response.statusText}
              </div>
            `;
          }
        } catch (error) {
          resultDiv.innerHTML = `
            <div style="padding: 10px; background: #f8d7da; border-radius: 5px; color: #721c24;">
              <i class="fas fa-unlink"></i> Connection failed: ${error.message}
            </div>
          `;
        }
      });
      
      document.getElementById('saveUrlBtn').addEventListener('click', () => {
        const url = document.getElementById('apiUrlInput').value.trim();
        if (!url) {
          this.error('Please enter a URL');
          return;
        }
        
        CONFIG.API_URL = url;
        localStorage.setItem('iim_api_url', url);
        modal.remove();
        resolve();
        
        // Refresh the page to apply new URL
        setTimeout(() => location.reload(), 500);
      });
      
      // Close modal on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve();
        }
      });
    });
  }

  static setupErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.error(`Application error: ${e.message}`);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.error(`Operation failed: ${e.reason?.message || e.reason || 'Unknown error'}`);
    });

    window.addEventListener('offline', () => {
      this.error('You are offline. Some features may not work.');
    });
  }

  static validateSession() {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginTime = localStorage.getItem('loginTime');
    const page = location.pathname.split('/').pop();

    if (loggedIn && loginTime) {
      const sessionAge = Date.now() - new Date(loginTime).getTime();
      if (sessionAge > CONFIG.SESSION_TIMEOUT) {
        this.showSessionWarning();
        return;
      }
    }

    const role = localStorage.getItem('userRole');
    
    if (['dashboard.html', 'register.html'].includes(page) && !loggedIn) {
      location.href = 'login.html';
      return;
    }
    
    if (page === 'dashboard.html' && role !== 'admin') {
      location.href = 'login.html?role=admin';
      return;
    }
    
    if (page === 'register.html' && !['masul', 'admin'].includes(role)) {
      location.href = 'login.html?role=masul';
      return;
    }
  }

  static showSessionWarning() {
    const warning = document.createElement('div');
    warning.className = 'session-warning';
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ffc107;
      color: #856404;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
    `;
    
    warning.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>Your session has expired. Please login again.</span>
      <button onclick="App.logout()" style="
        background: none;
        border: none;
        color: inherit;
        margin-left: auto;
        cursor: pointer;
        font-weight: 600;
      ">OK</button>
    `;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
      warning.remove();
      App.logout();
    }, 5000);
  }

  static fixDriveImageUrl(url) {
    if (!url || url === '' || url === 'undefined' || url === 'null') {
      return '';
    }
    
    // If already a thumbnail URL, return as-is
    if (url.includes('thumbnail')) {
      return url;
    }
    
    // Extract file ID from various Google Drive URL formats
    let fileId = '';
    
    // Pattern 1: /uc?id=FILE_ID
    const ucMatch = url.match(/[?&]id=([^&]+)/);
    if (ucMatch) {
      fileId = ucMatch[1];
    }
    // Pattern 2: /d/FILE_ID/
    else if (url.includes('/d/')) {
      const dMatch = url.match(/\/d\/([^\/]+)/);
      if (dMatch) {
        fileId = dMatch[1];
      }
    }
    // Pattern 3: /file/d/FILE_ID/
    else if (url.includes('/file/d/')) {
      const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
      if (fileMatch) {
        fileId = fileMatch[1];
      }
    }
    
    if (fileId) {
      // Return thumbnail URL for proper image display
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    
    // If not a Drive URL or pattern not matched, return original
    return url;
  }

  static async api(action, data = {}) {
    console.log(`📡 API Request: ${action}`, data);
    
    if (!CONFIG.API_URL) {
      throw new Error('API URL not configured. Please set up backend URL.');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    
    try {
      const requestData = {
        action,
        ...data,
        userRole: localStorage.getItem('userRole') || '',
        userBranch: localStorage.getItem('userBranch') || '',
        timestamp: Date.now(),
        clientIp: 'web_client'
      };
      
      const formData = new FormData();
      formData.append('data', JSON.stringify(requestData));
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      let jsonResponse;
      
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError, 'Response:', responseText);
        throw new Error('Invalid response from server');
      }
      
      if (!jsonResponse.success) {
        throw new Error(jsonResponse.message || 'Request failed');
      }
      
      return jsonResponse;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ API Call Failed:', error);
      
      let userMessage;
      if (error.name === 'AbortError') {
        userMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Cannot connect to server. Please check your internet connection and API URL.';
      } else {
        userMessage = error.message;
      }
      
      this.error(userMessage);
      throw error;
    }
  }

  static loading(show = true, msg = 'Loading...') {
    let loader = document.getElementById('globalLoader');
    
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'globalLoader';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
      `;
      loader.innerHTML = `
        <div class="loading-spinner" style="
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #228B22;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="margin-top: 20px; font-size: 16px;">${msg}</p>
      `;
      document.body.appendChild(loader);
    } else if (loader) {
      loader.style.display = show ? 'flex' : 'none';
      if (show && msg) {
        const p = loader.querySelector('p');
        if (p) p.textContent = msg;
      }
    }
  }

  static error(msg) {
    console.error(`Error: ${msg}`);
    
    const existing = document.querySelector('.error-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
      max-width: 400px;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span style="flex: 1;">${msg}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  static success(msg) {
    console.log(`Success: ${msg}`);
    
    const existing = document.querySelector('.success-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
      max-width: 400px;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span style="flex: 1;">${msg}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }

  static setupGlobalEvents() {
    // Password toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.password-toggle')) {
        const btn = e.target.closest('.password-toggle');
        const input = btn.closest('.input-group')?.querySelector('input') || 
                     btn.closest('.input-with-icon')?.querySelector('input');
        const icon = btn.querySelector('i');
        
        if (input && icon) {
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      }
    });
    
    // Form validation
    document.addEventListener('blur', (e) => {
      if (e.target.matches('input[required], select[required], textarea[required]')) {
        this.validateField(e.target);
      }
    }, true);
  }

  static validateField(input) {
    if (!input.value.trim() && input.required) {
      input.classList.add('invalid');
      return false;
    }
    
    if (input.type === 'email' && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        input.classList.add('invalid');
        return false;
      }
    }
    
    if (input.type === 'tel' && input.value) {
      const phoneRegex = /^[0-9+\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(input.value)) {
        input.classList.add('invalid');
        return false;
      }
    }
    
    input.classList.remove('invalid');
    input.classList.add('valid');
    return true;
  }

  static loadCurrentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
      case 'login.html':
        this.setupLogin();
        break;
      case 'register.html':
        this.setupRegister();
        break;
      case 'dashboard.html':
        this.setupDashboard();
        break;
      case 'index.html':
        this.setupLanding();
        break;
    }
  }

  static async setupLanding() {
    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
      currentYear.textContent = new Date().getFullYear();
    }
    
    const totalBranches = Object.values(ZONES).flat().length;
    const totalBranchesEl = document.getElementById('totalBranches');
    const totalZonesEl = document.getElementById('totalZones');
    
    if (totalBranchesEl) totalBranchesEl.textContent = totalBranches;
    if (totalZonesEl) totalZonesEl.textContent = Object.keys(ZONES).length;
    
    if (CONFIG.API_URL) {
      try {
        const response = await fetch(CONFIG.API_URL);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const totalMembersEl = document.getElementById('totalMembers');
            const totalMasulEl = document.getElementById('totalMasul');
            
            if (totalMembersEl) totalMembersEl.textContent = data.data?.totalMembers || 0;
            if (totalMasulEl) totalMasulEl.textContent = data.data?.totalMasul || 0;
          }
        }
      } catch (error) {
        console.log('Using default stats');
      }
    }
  }

  // ============================================
  // SIMPLIFIED LOGIN PAGE FUNCTION
  // ============================================
  static setupLogin() {
    console.log('🔧 Setting up login page...');
    
    // Set current year
    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    // Remove any URL parameters that might interfere
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, document.title, url);
    
    // Setup role buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    if (roleButtons.length > 0) {
        roleButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all buttons
                roleButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                const role = this.dataset.role;
                const loginTitle = document.getElementById('loginTitle');
                if (loginTitle) {
                    loginTitle.textContent = role === 'admin' ? 'Admin Login' : 'Branch Mas\'ul Login';
                }
                
                // Show/hide branch selection
                const branchGroup = document.getElementById('branchGroup');
                const branchSelect = document.getElementById('branchSelect');
                
                if (branchGroup && branchSelect) {
                    if (role === 'masul') {
                        branchGroup.style.display = 'block';
                        branchSelect.required = true;
                        
                        // Populate branches if not already
                        if (branchSelect.options.length <= 1) {
                            this.populateBranches('branchSelect');
                        }
                    } else {
                        branchGroup.style.display = 'none';
                        branchSelect.required = false;
                        branchSelect.value = '';
                    }
                }
                
                // Focus on access code field
                setTimeout(() => {
                    const accessCodeInput = document.getElementById('accessCode');
                    if (accessCodeInput) {
                        accessCodeInput.focus();
                    }
                }, 100);
            });
        });
    }
    
    // Set initial role based on URL or default to admin
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam === 'masul') {
        const masulBtn = document.getElementById('masulBtn');
        if (masulBtn) {
            masulBtn.click();
        }
    } else {
        // Default to admin
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.click();
        }
    }
    
    // Populate branches dropdown
    this.populateBranches('branchSelect');
    
    // Setup form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('Login form submitted');
            
            // Get selected role
            const activeBtn = document.querySelector('.role-btn.active');
            if (!activeBtn) {
                this.error('Please select a role (Admin or Branch Mas\'ul)');
                return;
            }
            
            const role = activeBtn.dataset.role;
            const accessCode = document.getElementById('accessCode').value.trim();
            const branchSelect = document.getElementById('branchSelect');
            const branch = role === 'masul' ? (branchSelect ? branchSelect.value : '') : '';
            
            console.log(`Attempting login - Role: ${role}, Branch: ${branch}`);
            
            // Basic validation
            if (!accessCode) {
                this.error('Access code is required');
                return;
            }
            
            if (role === 'masul' && !branch) {
                this.error('Please select your branch');
                return;
            }
            
            // Show loading
            this.loading(true, 'Authenticating...');
            
            try {
                // Call API
                const res = await this.api('login', {
                    role: role,
                    accessCode: accessCode,
                    branch: branch
                });
                
                console.log('Login successful:', res);
                
                // Store session data
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', role);
                localStorage.setItem('userBranch', branch || '');
                localStorage.setItem('loginTime', new Date().toISOString());
                localStorage.setItem('userName', role === 'admin' ? 'Administrator' : `Mas'ul (${branch})`);
                
                this.success('Login successful! Redirecting...');
                
                // Redirect based on role
                setTimeout(() => {
                    window.location.href = role === 'admin' ? 'dashboard.html' : 'register.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login failed:', error);
                this.loading(false);
                
                // Show appropriate error message
                let errorMessage = 'Login failed. ';
                
                if (error.message.includes('Invalid access code')) {
                    errorMessage = 'Incorrect access code. Please try again.';
                } else if (error.message.includes('Branch is required')) {
                    errorMessage = 'Please select your branch.';
                } else if (error.message.includes('Invalid branch')) {
                    errorMessage = 'Selected branch is not valid.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Cannot connect to server. Please check your internet connection.';
                } else {
                    errorMessage += error.message;
                }
                
                this.error(errorMessage);
            }
        });
    }
    
    // Auto-focus access code field
    setTimeout(() => {
        const accessCodeInput = document.getElementById('accessCode');
        if (accessCodeInput) {
            accessCodeInput.focus();
        }
    }, 500);
    
    // Check backend status
    this.checkBackendStatus();
  }

  static async checkBackendStatus() {
    const backendInfo = document.getElementById('backendInfo');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (!backendInfo || !statusDot || !statusText) return;
    
    try {
        // Use saved API URL or default
        const apiUrl = localStorage.getItem('iim_api_url') || CONFIG.API_URL;
        
        if (!apiUrl || apiUrl.includes('YOUR_NEW_GAS_WEB_APP_URL')) {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'API URL not configured';
            backendInfo.style.display = 'flex';
            return;
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-cache',
            mode: 'no-cors'  // This helps with CORS issues
        });
        
        // Even with no-cors we can check if the request was made
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Connected to backend';
        backendInfo.style.display = 'flex';
        
    } catch (error) {
        console.log('Backend status check:', error);
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Backend connection failed';
        backendInfo.style.display = 'flex';
    }
  }

  static populateBranches(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add branches grouped by zones
    Object.entries(ZONES).forEach(([zone, branches]) => {
        const group = document.createElement('optgroup');
        group.label = `ZONE: ${zone}`;
        
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            group.appendChild(option);
        });
        
        select.appendChild(group);
    });
  }

  static populateZones(selectId, branchId) {
    const zoneSel = document.getElementById(selectId);
    const branchSel = document.getElementById(branchId);
    
    if (!zoneSel || !branchSel) return;
    
    zoneSel.innerHTML = '<option value="">Select Zone</option>';
    branchSel.innerHTML = '<option value="">Select Branch</option>';
    
    Object.keys(ZONES).forEach(zone => {
      const opt = document.createElement('option');
      opt.value = zone;
      opt.textContent = zone;
      zoneSel.appendChild(opt);
    });
    
    zoneSel.addEventListener('change', () => {
      branchSel.innerHTML = '<option value="">Select Branch</option>';
      
      const selectedZone = zoneSel.value;
      if (selectedZone && ZONES[selectedZone]) {
        ZONES[selectedZone].forEach(branch => {
          const opt = document.createElement('option');
          opt.value = branch;
          opt.textContent = branch;
          branchSel.appendChild(opt);
        });
      }
    });
  }

  static populateYears(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    
    sel.innerHTML = '<option value="">Select Year</option>';
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= currentYear - 30; year--) {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      sel.appendChild(opt);
    }
  }

  // ============================================
  // REGISTRATION PAGE - NO CHANGES NEEDED
  // ============================================
  static setupRegister() {
    console.log('🔧 Setting up registration page...');
    
    const initRegistration = () => {
      console.log('DOM ready for registration setup');
      
      // 1. Show current user info
      const userName = localStorage.getItem('userName') || 'User';
      const userBranch = localStorage.getItem('userBranch');
      const currentBranch = document.getElementById('currentBranch');
      
      if (currentBranch) {
        currentBranch.textContent = userBranch ? `Branch: ${userBranch}` : `User: ${userName}`;
      }
      
      // 2. Admin can register Mas'ul
      const userRole = localStorage.getItem('userRole');
      const masulToggleContainer = document.getElementById('masulToggleContainer');
      
      if (masulToggleContainer && userRole === 'admin') {
        masulToggleContainer.style.display = 'block';
      }
      
      // 3. Initialize form elements
      this.populateZones('zone', 'branch');
      this.populateYears('recruitmentYear');
      this.setupPhoto('photoUpload', 'photoInput', 'photoPreview');
      
      // 4. Set date limits
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 8, today.getMonth(), today.getDate());
      
      const birthDate = document.getElementById('birthDate');
      const masulBirthDate = document.getElementById('masulBirthDate');
      
      if (birthDate) {
        birthDate.setAttribute('min', minDate.toISOString().split('T')[0]);
        birthDate.setAttribute('max', maxDate.toISOString().split('T')[0]);
      }
      
      if (masulBirthDate) {
        masulBirthDate.setAttribute('min', minDate.toISOString().split('T')[0]);
        masulBirthDate.setAttribute('max', maxDate.toISOString().split('T')[0]);
      }
      
      // 5. Phone validation
      document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function(e) {
          this.value = this.value.replace(/[^0-9+]/g, '');
        });
      });
      
      // ✅✅✅ CRITICAL FIX 1: Setup tab switching
      this.setupFormTabs();
      
      // ✅✅✅ CRITICAL FIX 2: Member registration form
      const setupMemberForm = () => {
        const memberForm = document.getElementById('memberRegistrationForm');
        console.log('Looking for member form:', memberForm);
        
        if (!memberForm) {
          console.error('Member form not found, retrying...');
          setTimeout(setupMemberForm, 100);
          return;
        }
        
        // Remove existing listener if any
        const oldForm = memberForm.cloneNode(true);
        memberForm.parentNode.replaceChild(oldForm, memberForm);
        
        // Attach new listener
        document.getElementById('memberRegistrationForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('✅ Member form SUBMITTED!');
          await App.handleMemberRegistration();
        });
        
        console.log('✅ Member form event listener attached');
      };
      
      setupMemberForm();
      
      // 6. Mas'ul registration toggle
      const masulToggle = document.getElementById('masulToggle');
      if (masulToggle) {
        masulToggle.addEventListener('change', e => {
          const showMasulForm = e.target.checked;
          
          const formTitle = document.getElementById('formTitle');
          const memberFormSection = document.getElementById('memberFormSection');
          const masulFormSection = document.getElementById('masulFormSection');
          
          if (formTitle) {
            formTitle.textContent = showMasulForm ? 'Mas\'ul Registration' : 'Member Registration (Muntazirun)';
          }
          
          if (memberFormSection) {
            memberFormSection.style.display = showMasulForm ? 'none' : 'block';
          }
          
          if (masulFormSection) {
            masulFormSection.style.display = showMasulForm ? 'block' : 'none';
          }
          
          if (showMasulForm) {
            this.populateZones('masulZone', 'masulBranch');
            this.populateYears('masulRecruitmentYear');
            this.setupPhoto('masulPhotoUpload', 'masulPhotoInput', 'masulPhotoPreview');
          }
        });
      }
      
      // 7. Mas'ul registration form
      const masulForm = document.getElementById('masulRegistrationForm');
      if (masulForm) {
        masulForm.addEventListener('submit', async e => {
          e.preventDefault();
          await this.handleMasulRegistration();
        });
      }
      
      // 8. Cancel Mas'ul form
      const cancelMasulBtn = document.getElementById('cancelMasulForm');
      if (cancelMasulBtn) {
        cancelMasulBtn.addEventListener('click', () => {
          const masulToggle = document.getElementById('masulToggle');
          if (masulToggle) {
            masulToggle.checked = false;
            masulToggle.dispatchEvent(new Event('change'));
          }
        });
      }
      
      console.log('✅ Registration page setup complete');
    };
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initRegistration);
    } else {
      initRegistration();
    }
  }

  static setupFormTabs() {
    const steps = document.querySelectorAll('.step');
    const sections = document.querySelectorAll('.form-section');
    
    // Function to switch tabs
    const switchTab = (stepId) => {
      // Update steps
      steps.forEach(step => {
        step.classList.remove('active');
        step.classList.remove('completed');
      });
      
      const activeStep = document.querySelector(`.step[data-step="${stepId}"]`);
      if (activeStep) {
        activeStep.classList.add('active');
        
        // Mark previous steps as completed
        const stepArray = Array.from(steps);
        const currentIndex = stepArray.findIndex(s => s === activeStep);
        for (let i = 0; i < currentIndex; i++) {
          stepArray[i].classList.add('completed');
        }
      }
      
      // Show corresponding section
      sections.forEach(section => {
        section.classList.remove('active');
      });
      
      const targetSection = document.getElementById(stepId + 'Tab');
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Update progress bar
      this.updateFormProgress(stepId);
      
      // Update button states
      const prevButtons = document.querySelectorAll('.prev-tab');
      const nextButtons = document.querySelectorAll('.next-tab');
      
      if (stepId === 'personal') {
        prevButtons.forEach(btn => btn.disabled = true);
      } else {
        prevButtons.forEach(btn => btn.disabled = false);
      }
      
      if (stepId === 'membership') {
        nextButtons.forEach(btn => btn.style.display = 'none');
      } else {
        nextButtons.forEach(btn => btn.style.display = 'inline-flex');
      }
    };
    
    // Add click handlers to steps
    steps.forEach(step => {
      step.addEventListener('click', function() {
        const stepId = this.dataset.step;
        switchTab(stepId);
      });
    });
    
    // Next button handlers
    document.querySelectorAll('.next-tab').forEach(btn => {
      btn.addEventListener('click', function() {
        const currentSection = document.querySelector('.form-section.active');
        if (!currentSection) return;
        
        const currentStepId = currentSection.id.replace('Tab', '');
        const stepsOrder = ['personal', 'contact', 'membership'];
        const currentIndex = stepsOrder.indexOf(currentStepId);
        
        if (currentIndex < stepsOrder.length - 1) {
          const nextStep = stepsOrder[currentIndex + 1];
          switchTab(nextStep);
        }
      });
    });
    
    // Previous button handlers
    document.querySelectorAll('.prev-tab').forEach(btn => {
      btn.addEventListener('click', function() {
        const currentSection = document.querySelector('.form-section.active');
        if (!currentSection) return;
        
        const currentStepId = currentSection.id.replace('Tab', '');
        const stepsOrder = ['personal', 'contact', 'membership'];
        const currentIndex = stepsOrder.indexOf(currentStepId);
        
        if (currentIndex > 0) {
          const prevStep = stepsOrder[currentIndex - 1];
          switchTab(prevStep);
        }
      });
    });
    
    // Initialize with first tab
    if (steps.length > 0) {
      const firstStep = steps[0];
      switchTab(firstStep.dataset.step);
    }
  }

  static updateFormProgress(currentStep) {
    const progressBar = document.getElementById('formProgress');
    if (!progressBar) return;
    
    const steps = ['personal', 'contact', 'membership'];
    const currentIndex = steps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${Math.round(progress)}%`;
  }

  static async compressPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      if (file.size > CONFIG.MAX_PHOTO_SIZE) {
        reject(new Error('Photo too large (maximum 2MB)'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let { width, height } = img;
          
          const maxSize = 800;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            } else {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(base64);
          } catch (error) {
            reject(new Error('Failed to compress image'));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  static setupPhoto(uploadAreaId, inputId, previewId) {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!area || !input || !preview) return;
    
    area.addEventListener('click', () => input.click());
    
    // Drag and drop events
    ['dragover', 'dragenter'].forEach(event => {
      area.addEventListener(event, (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'dragend', 'drop'].forEach(event => {
      area.addEventListener(event, (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
      });
    });
    
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
    
    input.addEventListener('change', async () => {
      const file = input.files[0];
      
      if (!file) {
        preview.style.display = 'none';
        input.dataset.base64 = '';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        this.error('Please select an image file (JPG, PNG)');
        input.value = '';
        preview.style.display = 'none';
        input.dataset.base64 = '';
        return;
      }
      
      try {
        this.loading(true, 'Processing image...');
        const base64 = await this.compressPhoto(file);
        preview.src = base64;
        preview.style.display = 'block';
        preview.classList.add('show');
        input.dataset.base64 = base64;
        
        // Show remove button
        const removeBtn = preview.nextElementSibling;
        if (removeBtn && removeBtn.classList.contains('photo-remove')) {
          removeBtn.style.display = 'flex';
          removeBtn.onclick = () => {
            input.value = '';
            preview.style.display = 'none';
            preview.classList.remove('show');
            input.dataset.base64 = '';
            removeBtn.style.display = 'none';
          };
        }
        
        console.log('Photo compressed successfully');
      } catch (error) {
        this.error(error.message);
        input.value = '';
        preview.style.display = 'none';
        input.dataset.base64 = '';
      } finally {
        this.loading(false);
      }
    });
  }

  static async handleMemberRegistration() {
    console.log('🔴 DEBUG: handleMemberRegistration called');
    
    try {
      // Show loading
      this.loading(true, 'Registering member...');
      
      // Validate all required fields first
      const requiredFields = [
        'fullName', 'firstName', 'fatherName', 'birthDate', 'gender',
        'residentialAddress', 'phone1', 'memberLevel', 'zone', 'branch',
        'recruitmentYear'
      ];
      
      let isValid = true;
      let errorMessage = '';
      
      // Collect all errors
      requiredFields.forEach(field => {
        const element = document.getElementById(field);
        const value = element ? element.value.trim() : '';
        
        if (!value) {
          isValid = false;
          element.classList.add('invalid');
          const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          errorMessage += `• ${fieldName} is required\n`;
        } else {
          if (element) element.classList.remove('invalid');
        }
      });
      
      // If invalid, show alert and return
      if (!isValid) {
        alert('Please fix the following errors:\n\n' + errorMessage);
        this.loading(false);
        return;
      }
      
      // Validate date
      const birthDate = new Date(document.getElementById('birthDate').value);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - 8, today.getMonth(), today.getDate());
      
      if (birthDate < minAge || birthDate > maxAge) {
        alert('Age must be between 8 and 100 years');
        this.loading(false);
        return;
      }
      
      // Prepare data
      const photoInput = document.getElementById('photoInput');
      
      const formData = {
        fullName: document.getElementById('fullName').value,
        firstName: document.getElementById('firstName').value,
        fatherName: document.getElementById('fatherName').value,
        grandfatherName: document.getElementById('grandfatherName').value,
        birthDate: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        residentialAddress: document.getElementById('residentialAddress').value,
        neighborhood: document.getElementById('neighborhood').value,
        localGovernment: document.getElementById('localGovernment').value,
        state: document.getElementById('state').value,
        phone1: document.getElementById('phone1').value,
        phone2: document.getElementById('phone2').value,
        parentsGuardians: document.getElementById('parentsGuardians').value,
        parentAddress: document.getElementById('parentAddress').value,
        parentNeighborhood: document.getElementById('parentNeighborhood').value,
        parentLGA: document.getElementById('parentLGA').value,
        parentState: document.getElementById('parentState').value,
        zone: document.getElementById('zone').value,
        branch: document.getElementById('branch').value,
        recruitmentYear: document.getElementById('recruitmentYear').value,
        memberLevel: document.getElementById('memberLevel').value,
        photoBase64: photoInput?.dataset.base64 || ''
      };
      
      console.log('Sending registration data:', formData);
      
      // Call API
      const res = await this.api('registerMember', formData);
      
      // Show success
      alert('✅ Member registered successfully!\n\n' +
            `Global ID: ${res.data.globalId}\n` +
            `Recruitment ID: ${res.data.recruitmentId}\n` +
            `Name: ${res.data.fullName}\n` +
            `Branch: ${res.data.branch}`);
      
      this.showIdCard(res.data);
      this.success('Member registered successfully!');
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Show detailed error alert
      let userMessage = 'Registration failed. ';
      
      if (err.message.includes('Member already registered')) {
        userMessage = 'This member is already registered with the same phone or name.';
      } else if (err.message.includes('Invalid phone')) {
        userMessage = 'Please enter a valid phone number.';
      } else if (err.message.includes('Age must be')) {
        userMessage = 'Age must be between 8 and 100 years.';
      } else if (err.message.includes('Failed to fetch')) {
        userMessage = 'Cannot connect to server. Please check your internet connection.';
      } else {
        userMessage += err.message;
      }
      
      alert('❌ ' + userMessage);
      this.error(userMessage);
      
    } finally {
      this.loading(false);
    }
  }

  static async handleMasulRegistration() {
    const requiredFields = [
      'masulFullName', 'masulFatherName', 'masulBirthDate', 'masulEmail', 'masulPhone1',
      'masulEducationLevel', 'masulResidentialAddress', 'masulZone', 'masulBranch',
      'masulRecruitmentYear', 'masulGender'
    ];
    
    let isValid = true;
    requiredFields.forEach(field => {
      const element = document.getElementById(field);
      if (element && !element.value.trim()) {
        element.classList.add('invalid');
        isValid = false;
        this.error(`Please fill in ${field.replace('masul', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });
    
    if (!isValid) return;
    
    if (!document.getElementById('masulDeclaration').checked) {
      this.error('Please accept the declaration');
      return;
    }
    
    this.loading(true, 'Registering Mas\'ul...');
    
    try {
      const photoInput = document.getElementById('masulPhotoInput');
      
      const formData = {
        fullName: document.getElementById('masulFullName').value,
        fatherName: document.getElementById('masulFatherName').value,
        birthDate: document.getElementById('masulBirthDate').value,
        gender: document.getElementById('masulGender').value,
        email: document.getElementById('masulEmail').value,
        phone1: document.getElementById('masulPhone1').value,
        phone2: document.getElementById('masulPhone2').value,
        educationLevel: document.getElementById('masulEducationLevel').value,
        courseStudying: document.getElementById('masulCourseStudying').value,
        residentialAddress: document.getElementById('masulResidentialAddress').value,
        zone: document.getElementById('masulZone').value,
        branch: document.getElementById('masulBranch').value,
        recruitmentYear: document.getElementById('masulRecruitmentYear').value,
        declaration: true,
        photoBase64: photoInput?.dataset.base64 || ''
      };
      
      const res = await this.api('registerMasul', formData);
      this.showIdCard(res.data);
      this.success('Mas\'ul registered successfully!');
    } catch (err) {
      console.error('Masul registration error:', err);
    } finally {
      this.loading(false);
    }
  }

  static showIdCard(data) {
    const formContainer = document.getElementById('formContainer');
    const successMessage = document.getElementById('successMessage');
    const loadingState = document.getElementById('loadingState');
    
    if (formContainer) formContainer.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
    if (loadingState) loadingState.style.display = 'none';
    
    // Populate ID card
    const elements = {
      'printFullName': data.fullName || 'N/A',
      'printGlobalId': data.globalId || 'N/A',
      'printRecruitmentId': data.recruitmentId || 'N/A',
      'printBranch': data.branch || 'N/A',
      'printLevel': data.level || data.memberLevel || 'N/A',
      'printDate': new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
    
    // Photo
    if (data.photoUrl) {
      const photoEl = document.getElementById('printPhoto');
      const placeholderEl = document.getElementById('photoPlaceholder');
      
      if (photoEl) {
        photoEl.src = this.fixDriveImageUrl(data.photoUrl);
        photoEl.style.display = 'block';
        photoEl.onerror = function() {
          this.style.display = 'none';
          if (placeholderEl) {
            placeholderEl.style.display = 'flex';
          }
        };
        
        if (placeholderEl) {
          placeholderEl.style.display = 'none';
        }
      }
    } else {
      const placeholderEl = document.getElementById('photoPlaceholder');
      const photoEl = document.getElementById('printPhoto');
      
      if (placeholderEl) {
        placeholderEl.style.display = 'flex';
      }
      
      if (photoEl) {
        photoEl.style.display = 'none';
      }
    }
    
    // Register another button
    const registerAnotherBtn = document.getElementById('registerAnother');
    if (registerAnotherBtn) {
      registerAnotherBtn.onclick = () => {
        if (successMessage) successMessage.style.display = 'none';
        if (formContainer) formContainer.style.display = 'block';
        
        // Reset forms
        const memberForm = document.getElementById('memberRegistrationForm');
        const masulForm = document.getElementById('masulRegistrationForm');
        
        if (memberForm) memberForm.reset();
        if (masulForm) masulForm.reset();
        
        // Reset photos
        const photoPreview = document.getElementById('photoPreview');
        const masulPhotoPreview = document.getElementById('masulPhotoPreview');
        const photoInput = document.getElementById('photoInput');
        const masulPhotoInput = document.getElementById('masulPhotoInput');
        
        if (photoPreview) {
          photoPreview.style.display = 'none';
          photoPreview.classList.remove('show');
        }
        if (masulPhotoPreview) {
          masulPhotoPreview.style.display = 'none';
          masulPhotoPreview.classList.remove('show');
        }
        if (photoInput) {
          photoInput.value = '';
          photoInput.dataset.base64 = '';
        }
        if (masulPhotoInput) {
          masulPhotoInput.value = '';
          masulPhotoInput.dataset.base64 = '';
        }
        
        // Reset to first tab
        const firstStep = document.querySelector('.step[data-step="personal"]');
        if (firstStep) {
          firstStep.click();
        }
      };
    }
  }

  static printIdCard() {
    // Add print class for specific styling
    document.body.classList.add('printing');
    
    // Wait a moment for styles to apply, then print
    setTimeout(() => {
      window.print();
      
      // Remove print class after printing
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 1000);
    }, 100);
  }

  // ============================================
  // DASHBOARD FUNCTIONS
  // ============================================
  static setupDashboard() {
    console.log('Setting up dashboard...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
      // Setup hamburger menu
      this.setupHamburgerMenu();
      
      // Setup menu navigation
      this.setupMenuNavigation();
      
      // Initialize filters
      this.populateZones('zoneFilter', 'branchFilter');
      
      // Setup filter events
      this.setupFilterEvents();
      
      // Setup settings form
      this.setupSettingsForm();
      
      // Setup export buttons
      this.setupExportButtons();
      
      // Load initial data
      this.loadOverview();
      
      console.log('✅ Dashboard setup complete');
    }, 100);
  }

  static setupHamburgerMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const mobileOverlay = document.querySelector('.overlay');
    const mainContent = document.querySelector('.main-content');
    
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('collapsed');
        
        if (window.innerWidth <= 992) {
          if (mobileOverlay) {
            if (sidebar.classList.contains('collapsed')) {
              mobileOverlay.classList.add('active');
            } else {
              mobileOverlay.classList.remove('active');
            }
          }
        }
      });
    }
    
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        if (sidebar) {
          sidebar.classList.remove('collapsed');
        }
        if (mobileOverlay) {
          mobileOverlay.classList.remove('active');
        }
      });
    }
    
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => {
        if (sidebar) {
          sidebar.classList.remove('collapsed');
        }
        mobileOverlay.classList.remove('active');
      });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('collapsed')) {
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnMenuToggle = menuToggle && menuToggle.contains(e.target);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle) {
          sidebar.classList.remove('collapsed');
          if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
          }
        }
      }
    });
  }

  static setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    const pageTitle = document.getElementById('pageTitle');
    
    menuItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        
        const section = item.dataset.section;
        if (!section) return;
        
        // Update active menu item
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        dashboardSections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(section + 'Section');
        if (targetSection) {
          targetSection.classList.add('active');
        }
        
        // Update page title
        if (pageTitle) {
          pageTitle.textContent = item.textContent.trim();
        }
        
        // Load section data
        const methodName = `load${section.charAt(0).toUpperCase() + section.slice(1)}`;
        if (this[methodName] && typeof this[methodName] === 'function') {
          this[methodName]();
        }
        
        // Close sidebar on mobile after selection
        if (window.innerWidth < 992) {
          const sidebar = document.getElementById('sidebar');
          const mobileOverlay = document.querySelector('.overlay');
          
          if (sidebar) {
            sidebar.classList.remove('collapsed');
          }
          if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
          }
        }
      });
    });
  }

  static setupFilterEvents() {
    const zoneFilter = document.getElementById('zoneFilter');
    const branchFilter = document.getElementById('branchFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const memberSearch = document.getElementById('memberSearch');
    
    if (zoneFilter && branchFilter) {
      zoneFilter.addEventListener('change', () => {
        const zone = zoneFilter.value;
        
        branchFilter.innerHTML = '<option value="">All Branches</option>';
        
        if (zone && ZONES[zone]) {
          ZONES[zone].forEach(branch => {
            const opt = document.createElement('option');
            opt.value = branch;
            opt.textContent = branch;
            branchFilter.appendChild(opt);
          });
        }
      });
    }
    
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.loadMembers());
    }
    
    if (memberSearch) {
      memberSearch.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.loadMembers();
        }
      });
    }
  }

  static setupSettingsForm() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const adminCode = document.getElementById('adminAccessCode').value;
        const masulCode = document.getElementById('masulAccessCode').value;
        
        if (!adminCode && !masulCode) {
          this.error('Please enter at least one access code');
          return;
        }
        
        this.loading(true, 'Updating settings...');
        
        try {
          await this.api('updateSettings', {
            adminAccessCode: adminCode,
            masulAccessCode: masulCode
          });
          this.success('Settings updated successfully');
          settingsForm.reset();
        } catch (error) {
          console.error('Settings update failed:', error);
        } finally {
          this.loading(false);
        }
      });
    }
  }

  static setupExportButtons() {
    document.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.export;
        this.exportData(type);
      });
    });
  }

  static async loadOverview() {
    this.loading(true, 'Loading dashboard...');
    
    try {
      const res = await this.api('getStatistics');
      const stats = res.data || {};
      
      // Update stats grid
      const statsGrid = document.getElementById('statsGrid');
      if (statsGrid) {
        statsGrid.innerHTML = `
          <div class="stat-card">
            <span class="stat-number">${stats.totalMembers || 0}</span>
            <span class="stat-label">Total Members</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.totalMasul || 0}</span>
            <span class="stat-label">Mas'ul Leaders</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.brothers || 0}</span>
            <span class="stat-label">Brothers</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.sisters || 0}</span>
            <span class="stat-label">Sisters</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.recentMembers || 0}</span>
            <span class="stat-label">Recent (30 days)</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.totalBranches || 0}</span>
            <span class="stat-label">Active Branches</span>
          </div>
        `;
      }
      
      // Update counts in menu
      const membersCount = document.getElementById('membersCount');
      const masulCount = document.getElementById('masulCount');
      
      if (membersCount) membersCount.textContent = stats.totalMembers || 0;
      if (masulCount) masulCount.textContent = stats.totalMasul || 0;
      
      // Create charts
      this.createZoneChart(stats.membersPerBranch || {});
      this.createLevelChart(stats.membersPerLevel || {});
      
      // Load recent activity
      await this.loadRecentActivity();
      
    } catch (error) {
      console.error('Failed to load overview:', error);
      this.error('Failed to load dashboard data');
    } finally {
      this.loading(false);
    }
  }

  static createZoneChart(membersPerBranch) {
    const ctx = document.getElementById('zoneChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (ctx.chart) {
      ctx.chart.destroy();
    }
    
    const labels = Object.keys(membersPerBranch);
    const data = Object.values(membersPerBranch);
    
    ctx.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#228B22', '#32CD32', '#E67E22', '#2C3E50', '#17A2B8',
            '#6F42C1', '#20C997', '#FD7E14', '#DC3545'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Members Distribution by Branch'
          }
        }
      }
    });
  }

  static createLevelChart(membersPerLevel) {
    const ctx = document.getElementById('levelChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (ctx.chart) {
      ctx.chart.destroy();
    }
    
    const labels = Object.keys(membersPerLevel);
    const data = Object.values(membersPerLevel);
    
    ctx.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Members',
          data: data,
          backgroundColor: '#228B22'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Members'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Members Distribution by Level'
          }
        }
      }
    });
  }

  static async loadRecentActivity() {
    try {
      const res = await this.api('getRecentActivity');
      const activity = res.data || [];
      
      const activityList = document.getElementById('recentActivity');
      if (activityList) {
        if (activity.length === 0) {
          activityList.innerHTML = '<p class="text-muted">No recent activity</p>';
          return;
        }
        
        activityList.innerHTML = activity.map(item => `
          <div class="activity-item">
            <div class="activity-time">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="activity-desc">
              <strong>${item.action}</strong>: ${item.description}
              ${item.userBranch ? `<span class="activity-branch">(${item.userBranch})</span>` : ''}
            </div>
            <div class="activity-role">${item.userRole || 'System'}</div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  }

  static async loadMembers() {
    this.loading(true, 'Loading members...');
    
    try {
      const filters = {
        zone: document.getElementById('zoneFilter')?.value || '',
        branch: document.getElementById('branchFilter')?.value || '',
        level: document.getElementById('levelFilter')?.value || '',
        gender: document.getElementById('genderFilter')?.value || '',
        search: document.getElementById('memberSearch')?.value || ''
      };
      
      console.log('Loading members with filters:', filters);
      const res = await this.api('getMembers', filters);
      console.log('API Response:', res);
      
      const members = res.data || [];
      console.log('Members data:', members);
      
      const tbody = document.getElementById('membersTableBody');
      if (tbody) {
        if (members.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="10" class="text-center empty-state">
                <i class="fas fa-users-slash fa-3x"></i>
                <p>No members found matching your criteria</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = members.map(member => {
            // Extract properties with fallbacks for different naming conventions
            const id = member.id || member.Global_ID || member.globalId || 'N/A';
            const recruitmentId = member.recruitmentId || member.Recruitment_ID || 'N/A';
            const fullName = member.fullName || member.Full_Name || 'N/A';
            const gender = member.gender || member.Gender || 'N/A';
            const phone = member.phone || member.Phone_1 || 'N/A';
            const branch = member.branch || member.Branch || 'N/A';
            const level = member.level || member.Member_Level || 'N/A';
            const photoUrl = member.photoUrl || member.Photo_URL || '';
            
            // Generate photo HTML with fallback
            const photoHtml = photoUrl ? 
              `<img src="${this.fixDriveImageUrl(photoUrl)}" class="table-photo" alt="Photo" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
              '';
            
            const placeholderHtml = `<div class="photo-placeholder" ${photoUrl ? 'style="display:none;"' : ''}>
              ${(fullName || 'M').charAt(0)}
            </div>`;
            
            return `
              <tr>
                <td><input type="checkbox" class="selectMember" data-id="${id}"></td>
                <td>${photoHtml}${placeholderHtml}</td>
                <td><code>${id}</code></td>
                <td><code>${recruitmentId}</code></td>
                <td><strong>${fullName}</strong></td>
                <td><span class="badge ${gender === 'Brother' ? 'badge-primary' : 'badge-pink'}">${gender}</span></td>
                <td>${phone}</td>
                <td>${branch}</td>
                <td><span class="badge badge-level-${level?.toLowerCase() || 'unknown'}">${level}</span></td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="App.viewMember('${id}')" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-promote" onclick="App.promoteMember('${id}')" title="Promote">
                      <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-icon btn-transfer" onclick="App.transferMember('${id}')" title="Transfer">
                      <i class="fas fa-exchange-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
      
      // Setup select all checkbox
      const selectAll = document.getElementById('selectAllMembers');
      if (selectAll) {
        selectAll.checked = false;
        selectAll.onchange = (e) => {
          const checkboxes = document.querySelectorAll('.selectMember');
          checkboxes.forEach(cb => cb.checked = e.target.checked);
        };
      }
      
      this.success(`Loaded ${members.length} members`);
      
    } catch (error) {
      console.error('Failed to load members:', error);
      this.error('Failed to load members: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static async loadMasul() {
    this.loading(true, 'Loading Mas\'ul...');
    
    try {
      const res = await this.api('getMembers', { 
        search: '',
        type: 'masul' 
      });
      const masul = res.data || [];
      
      const tbody = document.getElementById('masulTableBody');
      if (tbody) {
        if (masul.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" class="text-center empty-state">
                <i class="fas fa-user-shield fa-3x"></i>
                <p>No Mas'ul leaders found</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = masul.map(m => {
            // Extract properties with fallbacks
            const id = m.id || m.Global_ID || 'N/A';
            const recruitmentId = m.recruitmentId || m.Recruitment_ID || 'N/A';
            const fullName = m.fullName || m.Full_Name || 'N/A';
            const email = m.email || m.Email || 'N/A';
            const phone = m.phone || m.Phone_1 || 'N/A';
            const branch = m.branch || m.Branch || 'N/A';
            const recruitmentYear = m.recruitmentYear || m.Recruitment_Year || 'N/A';
            const photoUrl = m.photoUrl || m.Photo_URL || '';
            
            // Generate photo HTML
            const photoHtml = photoUrl ? 
              `<img src="${this.fixDriveImageUrl(photoUrl)}" class="table-photo" alt="Photo" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
              '';
            
            const placeholderHtml = `<div class="photo-placeholder" ${photoUrl ? 'style="display:none;"' : ''}>
              ${(fullName || 'M').charAt(0)}
            </div>`;
            
            return `
              <tr>
                <td>${photoHtml}${placeholderHtml}</td>
                <td><code>${id}</code></td>
                <td><code>${recruitmentId}</code></td>
                <td><strong>${fullName}</strong></td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${branch}</td>
                <td>${recruitmentYear}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="App.viewMember('${id}')" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
      
      this.success(`Loaded ${masul.length} Mas'ul leaders`);
      
    } catch (error) {
      console.error('Failed to load Mas\'ul:', error);
      this.error('Failed to load Mas\'ul leaders');
    } finally {
      this.loading(false);
    }
  }

  static async loadPromotions() {
    this.loading(true, 'Loading promotions...');
    
    try {
      // For now, we'll load from members API with a flag
      // In a real app, you would have a dedicated promotions API
      const res = await this.api('getRecentActivity');
      const activity = res.data || [];
      
      const promotions = activity.filter(a => a.action.includes('promotion') || a.action.includes('Promotion'));
      
      const tbody = document.getElementById('promotionsTableBody');
      if (tbody) {
        if (promotions.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center empty-state">
                <i class="fas fa-chart-line fa-3x"></i>
                <p>No promotion logs found</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = promotions.map(promo => `
            <tr>
              <td>${new Date(promo.timestamp).toLocaleDateString()}</td>
              <td><code>${promo.description.split(' ')[0] || 'N/A'}</code></td>
              <td><span class="badge badge-level-${promo.description.includes('to') ? promo.description.split('to')[0].trim().toLowerCase() : 'unknown'}">
                ${promo.description.includes('to') ? promo.description.split('to')[0].trim() : 'N/A'}
              </span></td>
              <td><span class="badge badge-level-${promo.description.includes('to') ? promo.description.split('to')[1].trim().toLowerCase() : 'unknown'}">
                ${promo.description.includes('to') ? promo.description.split('to')[1].trim() : 'N/A'}
              </span></td>
              <td>${promo.userRole || 'Admin'}</td>
              <td>${promo.description || ''}</td>
            </tr>
          `).join('');
        }
      }
      
    } catch (error) {
      console.error('Failed to load promotions:', error);
      this.error('Failed to load promotion logs');
    } finally {
      this.loading(false);
    }
  }

  static async loadTransfers() {
    this.loading(true, 'Loading transfers...');
    
    try {
      const res = await this.api('getRecentActivity');
      const activity = res.data || [];
      
      const transfers = activity.filter(a => a.action.includes('transfer') || a.action.includes('Transfer'));
      
      const tbody = document.getElementById('transfersTableBody');
      if (tbody) {
        if (transfers.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center empty-state">
                <i class="fas fa-exchange-alt fa-3x"></i>
                <p>No transfer logs found</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = transfers.map(transfer => `
            <tr>
              <td>${new Date(transfer.timestamp).toLocaleDateString()}</td>
              <td><code>${transfer.description.split(' ')[0] || 'N/A'}</code></td>
              <td>${transfer.description.includes('from') ? transfer.description.split('from')[1]?.split('to')[0]?.trim() || 'N/A' : 'N/A'}</td>
              <td>${transfer.description.includes('to') ? transfer.description.split('to')[1]?.trim() || 'N/A' : 'N/A'}</td>
              <td>${transfer.userRole || 'Admin'}</td>
              <td>${transfer.description || ''}</td>
            </tr>
          `).join('');
        }
      }
      
    } catch (error) {
      console.error('Failed to load transfers:', error);
      this.error('Failed to load transfer logs');
    } finally {
      this.loading(false);
    }
  }

  static async loadLogs() {
    this.loading(true, 'Loading system logs...');
    
    try {
      const res = await this.api('getRecentActivity');
      const logs = res.data || [];
      
      const tbody = document.getElementById('logsTableBody');
      if (tbody) {
        if (logs.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="text-center empty-state">
                <i class="fas fa-history fa-3x"></i>
                <p>No system logs found</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = logs.map(log => `
            <tr>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
              <td><strong>${log.action}</strong></td>
              <td>${log.description}</td>
              <td>${log.userRole || 'System'}</td>
              <td>${log.userBranch || 'System'}</td>
            </tr>
          `).join('');
        }
      }
      
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.error('Failed to load system logs');
    } finally {
      this.loading(false);
    }
  }

  static async viewMember(id) {
    this.loading(true, 'Loading member details...');
    
    try {
      const res = await this.api('getMemberDetails', { memberId: id });
      const data = res.data;
      
      const modal = this.createMemberModal(data);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Failed to load member details:', error);
      this.error('Failed to load member details');
    } finally {
      this.loading(false);
    }
  }

  static createMemberModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        border-radius: 15px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        <div class="modal-header" style="
          padding: 20px;
          background: #228B22;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1;
        ">
          <h3 style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-user"></i> Member Details
          </h3>
          <button class="modal-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
        
        <div class="modal-body" style="padding: 20px;">
          ${this.createMemberDetailsHTML(data)}
        </div>
        
        <div class="modal-footer" style="
          padding: 20px;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        ">
          <button class="btn btn-secondary" style="
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
          ">Close</button>
          <button class="btn btn-primary" onclick="window.print()" style="
            padding: 10px 20px;
            background: #228B22;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <i class="fas fa-print"></i> Print Profile
          </button>
        </div>
      </div>
    `;
    
    // Close functionality
    const closeBtn = modal.querySelector('.modal-close');
    const closeBtn2 = modal.querySelector('.btn-secondary');
    
    const closeModal = () => modal.remove();
    
    closeBtn.addEventListener('click', closeModal);
    closeBtn2.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    return modal;
  }

  static createMemberDetailsHTML(data) {
    // Handle different data formats
    const fullName = data.Full_Name || data.fullName || 'N/A';
    const globalId = data.Global_ID || data.globalId || 'N/A';
    const recruitmentId = data.Recruitment_ID || data.recruitmentId || 'N/A';
    const type = data.Type || data.type || 'Member';
    const gender = data.Gender || data.gender || 'N/A';
    const branch = data.Branch || data.branch || 'N/A';
    const zone = data.Zone || data.zone || 'N/A';
    const level = data.Member_Level || data.level || 'N/A';
    const status = data.Status || data.status || 'Active';
    const phone1 = data.Phone_1 || data.phone1 || 'N/A';
    const phone2 = data.Phone_2 || data.phone2 || 'N/A';
    const email = data.Email || data.email || 'N/A';
    const address = data.Residential_Address || data.residentialAddress || 'N/A';
    const photoUrl = data.Photo_URL || data.photoUrl || '';
    const birthDate = data.Birth_Date || data.birthDate || 'N/A';
    const fatherName = data.Father_Name || data.fatherName || 'N/A';
    const localGovernment = data.Local_Government || data.localGovernment || 'N/A';
    const state = data.State || data.state || 'N/A';
    const registrationDate = data.Registration_Date || data.registrationDate || 'N/A';
    
    return `
      <div class="member-profile" style="
        display: flex;
        gap: 30px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      ">
        <div class="member-photo" style="flex-shrink: 0;">
          <img src="${photoUrl ? this.fixDriveImageUrl(photoUrl) : 'https://via.placeholder.com/200/228B22/FFFFFF?text=IIM'}" 
               alt="Photo" 
               style="
                 width: 200px;
                 height: 200px;
                 object-fit: cover;
                 border-radius: 10px;
                 border: 3px solid #228B22;
               "
               onerror="this.src='https://via.placeholder.com/200/228B22/FFFFFF?text=IIM'">
        </div>
        <div class="member-info" style="flex: 1; min-width: 300px;">
          <h4 style="margin: 0 0 20px 0; color: #333; font-size: 1.5rem;">${fullName}</h4>
          <div class="info-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          ">
            <div><strong>Global ID:</strong> <code>${globalId}</code></div>
            <div><strong>Recruitment ID:</strong> <code>${recruitmentId}</code></div>
            <div><strong>Type:</strong> ${type}</div>
            <div><strong>Gender:</strong> ${gender}</div>
            <div><strong>Branch:</strong> ${branch}</div>
            <div><strong>Zone:</strong> ${zone}</div>
            <div><strong>Level:</strong> ${level}</div>
            <div><strong>Status:</strong> ${status}</div>
          </div>
        </div>
      </div>
      
      <div class="contact-section" style="margin-bottom: 30px;">
        <h5 style="margin: 0 0 15px 0; color: #333; font-size: 1.2rem;">Contact Information</h5>
        <div class="info-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        ">
          <div><strong>Phone 1:</strong> ${phone1}</div>
          <div><strong>Phone 2:</strong> ${phone2}</div>
          <div><strong>Email:</strong> ${email}</div>
          <div><strong>Address:</strong> ${address}</div>
        </div>
      </div>
      
      ${type === 'Member' || type === 'member' ? `
        <div class="personal-section">
          <h5 style="margin: 0 0 15px 0; color: #333; font-size: 1.2rem;">Personal Information</h5>
          <div class="info-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          ">
            <div><strong>Father's Name:</strong> ${fatherName}</div>
            <div><strong>Birth Date:</strong> ${birthDate}</div>
            <div><strong>Local Government:</strong> ${localGovernment}</div>
            <div><strong>State:</strong> ${state}</div>
            <div><strong>Registration Date:</strong> ${new Date(registrationDate).toLocaleDateString()}</div>
          </div>
        </div>
      ` : ''}
    `;
  }

  static async promoteMember(id) {
    const newLevel = prompt(`Enter new level for member ${id}:\n\nAvailable levels: ${LEVELS.join(', ')}`);
    
    if (!newLevel || !LEVELS.includes(newLevel)) {
      if (newLevel) this.error('Invalid level. Please select from: ' + LEVELS.join(', '));
      return;
    }
    
    const notes = prompt('Enter promotion notes (optional):');
    
    if (confirm(`Promote member to ${newLevel}?`)) {
      this.loading(true, 'Promoting member...');
      
      try {
        await this.api('promoteMember', { 
          memberId: id, 
          newLevel: newLevel,
          notes: notes || ''
        });
        
        this.success('Member promoted successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Promotion failed:', error);
        this.error('Promotion failed: ' + error.message);
      } finally {
        this.loading(false);
      }
    }
  }

  static async transferMember(id) {
    const allBranches = Object.values(ZONES).flat();
    
    let branchList = '';
    allBranches.forEach((branch, index) => {
      branchList += `${index + 1}. ${branch}\n`;
    });
    
    const newBranch = prompt(`Enter new branch for member ${id}:\n\nAvailable branches:\n${branchList}`);
    
    if (!newBranch || !allBranches.includes(newBranch)) {
      if (newBranch) this.error('Invalid branch. Please select from the list.');
      return;
    }
    
    const notes = prompt('Enter transfer notes (optional):');
    
    if (confirm(`Transfer member to ${newBranch}?`)) {
      this.loading(true, 'Transferring member...');
      
      try {
        await this.api('transferMember', { 
          memberId: id, 
          newBranch: newBranch,
          notes: notes || ''
        });
        
        this.success('Member transferred successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Transfer failed:', error);
        this.error('Transfer failed: ' + error.message);
      } finally {
        this.loading(false);
      }
    }
  }

  static async exportData(type) {
    if (!confirm(`Export ${type} data as CSV?`)) return;
    
    this.loading(true, 'Exporting data...');
    
    try {
      const res = await this.api('exportData', { type: type });
      const data = res.data;
      
      if (data && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        this.success(`Export completed! File: ${data.fileName}`);
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.error('Export failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static async backupSystem() {
    if (!confirm('Create system backup? This may take a moment.')) return;
    
    this.loading(true, 'Creating backup...');
    
    try {
      const res = await this.api('backupSystem');
      const data = res.data;
      
      if (data && data.backupUrl) {
        window.open(data.backupUrl, '_blank');
        this.success('Backup created successfully!');
      } else {
        throw new Error('No backup URL received');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      this.error('Backup failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.success('Logged out successfully');
      setTimeout(() => {
        location.href = 'index.html';
      }, 1000);
    }
  }

  static switchSection(section) {
    const item = document.querySelector(`.menu-item[data-section="${section}"]`);
    if (item) {
      item.click();
    }
  }
}

// Enhanced initialization with error handling
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');
  
  // Add CSS animations if not present
  if (!document.querySelector('#app-animations')) {
    const style = document.createElement('style');
    style.id = 'app-animations';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Initialize the App
  if (typeof App !== 'undefined') {
    setTimeout(() => {
      App.init().catch(error => {
        console.error('Failed to initialize App:', error);
        App.error('Failed to initialize application. Please refresh the page.');
      });
    }, 100);
  } else {
    console.error('App is not defined. Check if app.js loaded correctly.');
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: #dc3545;
      color: white;
      padding: 15px;
      text-align: center;
      z-index: 9999;
      font-weight: 600;
    `;
    errorDiv.textContent = 'Error: Application failed to load. Please refresh the page.';
    document.body.appendChild(errorDiv);
  }
});

// Fallback initialization
setTimeout(() => {
  if (typeof App !== 'undefined' && typeof App.init === 'function') {
    if (!window.appInitialized) {
      window.appInitialized = true;
      App.init();
    }
  }
}, 500);

// Make App available globally
window.App = App;
console.log('✅ App.js loaded successfully with SIMPLIFIED LOGIN FIX!');
