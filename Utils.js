// Utils.gs - COMPLETE STANDALONE HELPER FUNCTIONS
// NO ASSUMPTIONS - ALL FUNCTIONS SELF-CONTAINED

// ========================
// UTILS CONFIGURATION (STANDALONE)
// ========================
const UTILS_CONFIG = {
  SYSTEM_NAME: 'Intizarul Imamul Muntazar',
  VERSION: '4.1.0',
  DEFAULT_ADMIN_CODE: 'Muntazirun',
  DEFAULT_MASUL_CODE: 'Muntazir',
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  LOCK_TIMEOUT: 30000,
  MAX_RETRIES: 3
};

// ========================
// ZONES FOR UTILS (STANDALONE COPY)
// ========================
const UTILS_ZONES = {
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

// ========================
// ATOMIC COUNTER LOCK SYSTEM
// ========================
const CounterLock = {
  locks: {},
  
  acquire(counterName) {
    const startTime = Date.now();
    const lockKey = `lock_${counterName}`;
    
    while (this.locks[lockKey]) {
      if (Date.now() - startTime > UTILS_CONFIG.LOCK_TIMEOUT) {
        throw new Error(`Timeout acquiring lock for ${counterName}`);
      }
      Utilities.sleep(100);
    }
    
    this.locks[lockKey] = {
      acquiredAt: Date.now(),
      threadId: Utilities.getUuid()
    };
    return true;
  },
  
  release(counterName) {
    const lockKey = `lock_${counterName}`;
    if (this.locks[lockKey]) {
      delete this.locks[lockKey];
    }
  },
  
  cleanupOldLocks() {
    const now = Date.now();
    for (const lockKey in this.locks) {
      if (this.locks[lockKey] && now - this.locks[lockKey].acquiredAt > UTILS_CONFIG.LOCK_TIMEOUT) {
        delete this.locks[lockKey];
      }
    }
  }
};

// ========================
// LOGGING FUNCTIONS
// ========================
function logToConsole(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`, data || '');
}

function logError(message, error) {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, error);
}

function logSuccess(message, data = null) {
  console.log(`[${new Date().toISOString()}] ✅ ${message}`, data || '');
}

// ========================
// SPREADSHEET FUNCTIONS
// ========================
function getSpreadsheet() {
  try {
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('SPREADSHEET_ID');
    
    if (!id) {
      throw new Error('Spreadsheet not initialized. Run initializeSystem first.');
    }
    
    const ss = SpreadsheetApp.openById(id);
    return ss;
  } catch (error) {
    logError('Failed to get spreadsheet:', error);
    throw new Error(`Cannot open spreadsheet: ${error.message}`);
  }
}

function getSheet(name) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(name);
    
    if (!sheet) {
      sheet = createSheetWithHeaders(name);
      logSuccess(`Sheet "${name}" created`);
    }
    
    return sheet;
  } catch (error) {
    logError(`Failed to get sheet "${name}":`, error);
    throw error;
  }
}

function createSheetWithHeaders(name) {
  const ss = getSpreadsheet();
  const sheet = ss.insertSheet(name);
  const headers = getHeadersForSheet(name);
  
  if (headers.length > 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#228B22');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getHeadersForSheet(name) {
  const headers = {
    'ALL_MEMBERS': [
      'Global_ID', 'Recruitment_ID', 'Type', 'Full_Name', 'First_Name', 'Father_Name', 'Grandfather_Name',
      'Birth_Date', 'Gender', 'Residential_Address', 'Neighborhood', 'Local_Government', 'State',
      'Parents_Guardians', 'Parent_Address', 'Parent_Neighborhood', 'Parent_LGA', 'Parent_State',
      'Phone_1', 'Phone_2', 'Email', 'Education_Level', 'Course_Studying', 'Member_Level', 'Zone', 'Branch',
      'Branch_Code', 'Recruitment_Year', 'Photo_URL', 'Registration_Date', 'Last_Updated', 'Status', 'Notes'
    ],
    'MEMBERS_ONLY': [
      'Global_ID', 'Recruitment_ID', 'Full_Name', 'Gender', 'Phone_1', 'Member_Level',
      'Recruitment_Year', 'Zone', 'Branch', 'Photo_URL', 'Registration_Date', 'Status'
    ],
    'MASUL_ONLY': [
      'Global_ID', 'Recruitment_ID', 'Full_Name', 'Email', 'Phone_1', 'Zone', 'Branch',
      'Recruitment_Year', 'Photo_URL', 'Registration_Date', 'Status'
    ],
    'BRANCH_COUNTERS': ['Key', 'Value', 'Last_Updated', 'Last_User'],
    'SETTINGS': ['Key', 'Value', 'Last_Updated'],
    'PROMOTION_LOGS': ['Member_ID', 'Old_Level', 'New_Level', 'Date', 'Admin', 'Notes', 'Full_Name'],
    'TRANSFER_LOGS': ['Member_ID', 'From_Branch', 'To_Branch', 'Date', 'Admin', 'Notes', 'Full_Name'],
    'ACTIVITY_LOGS': ['Timestamp', 'Action', 'Description', 'User_Role', 'User_Branch']
  };
  
  if (name.startsWith('BRANCH_')) {
    return [
      'Global_ID', 'Recruitment_ID', 'Full_Name', 'Gender', 'Phone_1', 'Member_Level',
      'Recruitment_Year', 'Photo_URL', 'Registration_Date', 'Status', 'Last_Updated'
    ];
  }
  
  return headers[name] || [];
}

// ========================
// SHEET OPERATIONS
// ========================
function appendToSheet(name, row, user = 'System') {
  try {
    const sheet = getSheet(name);
    sheet.appendRow(row);
    
    if (name.includes('MEMBERS') || name.includes('MASUL')) {
      logToConsole(`Row appended to sheet "${name}" by ${user}`);
    }
    
    return true;
  } catch (error) {
    logError(`Failed to append to sheet "${name}":`, error);
    throw error;
  }
}

function getSheetData(name) {
  try {
    const sheet = getSheet(name);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    return data.slice(1);
  } catch (error) {
    logError(`Failed to get data from sheet "${name}":`, error);
    throw error;
  }
}

function updateRowInSheet(sheetName, searchValue, searchColumn, updateValues, user = 'System') {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const searchColIndex = headers.indexOf(searchColumn);
    if (searchColIndex === -1) {
      throw new Error(`Column "${searchColumn}" not found`);
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][searchColIndex] === searchValue) {
        Object.keys(updateValues).forEach(key => {
          const colIndex = headers.indexOf(key);
          if (colIndex !== -1) {
            sheet.getRange(i + 1, colIndex + 1).setValue(updateValues[key]);
          }
        });
        
        const updateColIndex = headers.indexOf('Last_Updated');
        if (updateColIndex !== -1) {
          sheet.getRange(i + 1, updateColIndex + 1).setValue(new Date());
        }
        
        logToConsole(`Updated row in ${sheetName} for ${searchValue} by ${user}`);
        return true;
      }
    }
    
    throw new Error(`Row with ${searchColumn} = ${searchValue} not found`);
  } catch (error) {
    logError(`Failed to update row in sheet "${sheetName}":`, error);
    throw error;
  }
}

// ========================
// ATOMIC COUNTER FUNCTIONS
// ========================
function getNextGlobalId(user = 'System') {
  let retries = 0;
  
  while (retries < UTILS_CONFIG.MAX_RETRIES) {
    try {
      CounterLock.acquire('GLOBAL_ID_COUNTER');
      
      const countersSheet = getSheet('BRANCH_COUNTERS');
      const data = countersSheet.getDataRange().getValues();
      
      let rowIndex = -1;
      let counter = 0;
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === 'GLOBAL_ID_COUNTER') {
          rowIndex = i;
          counter = Number(data[i][1]) || 0;
          break;
        }
      }
      
      if (rowIndex === -1) {
        const newRow = ['GLOBAL_ID_COUNTER', 1, new Date(), user];
        countersSheet.appendRow(newRow);
        counter = 1;
      } else {
        counter++;
        countersSheet.getRange(rowIndex + 1, 2).setValue(counter);
        countersSheet.getRange(rowIndex + 1, 3).setValue(new Date());
        countersSheet.getRange(rowIndex + 1, 4).setValue(user);
      }
      
      const globalId = `MTZR/${counter.toString().padStart(4, '0')}`;
      
      CounterLock.release('GLOBAL_ID_COUNTER');
      logSuccess(`New Global ID: ${globalId} by ${user}`);
      return globalId;
      
    } catch (error) {
      retries++;
      logError(`Attempt ${retries} failed for getNextGlobalId:`, error);
      
      if (retries === UTILS_CONFIG.MAX_RETRIES) {
        CounterLock.release('GLOBAL_ID_COUNTER');
        throw new Error(`Failed to generate Global ID after ${retries} attempts`);
      }
      
      Utilities.sleep(500 * retries);
    }
  }
}

function getNextMemberSerial(branchCode, user = 'System') {
  let retries = 0;
  
  while (retries < UTILS_CONFIG.MAX_RETRIES) {
    try {
      CounterLock.acquire(`MEMBER_SERIAL_${branchCode}`);
      
      const countersSheet = getSheet('BRANCH_COUNTERS');
      const data = countersSheet.getDataRange().getValues();
      
      let rowIndex = -1;
      let serial = 0;
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === branchCode) {
          rowIndex = i;
          serial = Number(data[i][1]) || 0;
          break;
        }
      }
      
      if (rowIndex === -1) {
        const newRow = [branchCode, 1, new Date(), user];
        countersSheet.appendRow(newRow);
        serial = 1;
      } else {
        serial++;
        countersSheet.getRange(rowIndex + 1, 2).setValue(serial);
        countersSheet.getRange(rowIndex + 1, 3).setValue(new Date());
        countersSheet.getRange(rowIndex + 1, 4).setValue(user);
      }
      
      CounterLock.release(`MEMBER_SERIAL_${branchCode}`);
      logSuccess(`New member serial for ${branchCode}: ${serial} by ${user}`);
      return serial;
      
    } catch (error) {
      retries++;
      logError(`Attempt ${retries} failed for getNextMemberSerial(${branchCode}):`, error);
      
      if (retries === UTILS_CONFIG.MAX_RETRIES) {
        CounterLock.release(`MEMBER_SERIAL_${branchCode}`);
        throw new Error(`Failed to generate member serial after ${retries} attempts`);
      }
      
      Utilities.sleep(500 * retries);
    }
  }
}

function getNextMasulSerial(user = 'System') {
  let retries = 0;
  
  while (retries < UTILS_CONFIG.MAX_RETRIES) {
    try {
      CounterLock.acquire('MASUL_GLOBAL_SERIAL');
      
      const countersSheet = getSheet('BRANCH_COUNTERS');
      const data = countersSheet.getDataRange().getValues();
      
      let rowIndex = -1;
      let serial = 0;
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === 'MASUL_GLOBAL_SERIAL') {
          rowIndex = i;
          serial = Number(data[i][1]) || 0;
          break;
        }
      }
      
      if (rowIndex === -1) {
        const newRow = ['MASUL_GLOBAL_SERIAL', 1, new Date(), user];
        countersSheet.appendRow(newRow);
        serial = 1;
      } else {
        serial++;
        countersSheet.getRange(rowIndex + 1, 2).setValue(serial);
        countersSheet.getRange(rowIndex + 1, 3).setValue(new Date());
        countersSheet.getRange(rowIndex + 1, 4).setValue(user);
      }
      
      CounterLock.release('MASUL_GLOBAL_SERIAL');
      logSuccess(`New Masul serial: ${serial} by ${user}`);
      return serial;
      
    } catch (error) {
      retries++;
      logError(`Attempt ${retries} failed for getNextMasulSerial:`, error);
      
      if (retries === UTILS_CONFIG.MAX_RETRIES) {
        CounterLock.release('MASUL_GLOBAL_SERIAL');
        throw new Error(`Failed to generate Masul serial after ${retries} attempts`);
      }
      
      Utilities.sleep(500 * retries);
    }
  }
}

// ========================
// IMAGE UPLOAD
// ========================
function uploadImage(base64, branch, year) {
  try {
    if (!base64 || base64 === '' || base64 === 'undefined') {
      return '';
    }
    
    if (!base64.includes('data:image')) {
      throw new Error('Invalid base64 image data');
    }
    
    const [header, data] = base64.split(',');
    const mimeTypeMatch = header.match(/:(.*?);/);
    
    if (!mimeTypeMatch) {
      throw new Error('Cannot determine image MIME type');
    }
    
    const mimeType = mimeTypeMatch[1];
    
    if (!UTILS_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Invalid image type: ${mimeType}`);
    }
    
    const decoded = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(decoded, mimeType, `member_photo_${Date.now()}.jpg`);
    const fileSize = blob.getBytes().length;
    
    if (fileSize > UTILS_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
    }
    
    const rootFolder = getOrCreateFolder('IIM_Images', DriveApp.getRootFolder());
    const branchFolder = getOrCreateFolder(branch, rootFolder);
    const yearFolder = getOrCreateFolder(year.toString(), branchFolder);
    
    const fileName = `member_${Date.now()}_${Utilities.getUuid().substring(0, 8)}.jpg`;
    const file = yearFolder.createFile(blob);
    file.setName(fileName);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    // FIXED: Changed to thumbnail URL for proper image display
    const directImageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    
    logSuccess(`Image uploaded: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);
    return directImageUrl;
  } catch (error) {
    logError('Image upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}

function getOrCreateFolder(folderName, parentFolder) {
  const folders = parentFolder.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

// ========================
// ID GENERATION FUNCTIONS
// ========================
function generateBranchCode(branch) {
  try {
    const cleanBranch = branch.replace(/[^a-zA-Z0-9\s/]/g, '').trim();
    const parts = cleanBranch.split(/[\s/]+/);
    
    let code = '';
    if (parts.length >= 2) {
      code = parts[0].substring(0, 2).toUpperCase() + 
             parts[1].substring(0, 2).toUpperCase();
    } else {
      code = parts[0].substring(0, 4).toUpperCase();
    }
    
    if (code.length < 2) {
      code = code.padEnd(2, 'X');
    }
    
    return code;
  } catch (error) {
    logError(`Failed to generate branch code for "${branch}":`, error);
    return 'XXXX';
  }
}

// ========================
// DATA TRANSFORMATION FUNCTIONS
// ========================
function getMemberSubset(row) {
  return [
    row[0], // Global_ID
    row[1], // Recruitment_ID
    row[3], // Full_Name
    row[8], // Gender
    row[18], // Phone_1
    row[23], // Member_Level
    row[27], // Recruitment_Year
    row[24], // Zone
    row[25], // Branch
    row[28], // Photo_URL
    row[29], // Registration_Date
    row[31]  // Status
  ];
}

function getMasulSubset(row) {
  return [
    row[0], // Global_ID
    row[1], // Recruitment_ID
    row[3], // Full_Name
    row[20], // Email
    row[18], // Phone_1
    row[24], // Zone
    row[25], // Branch
    row[27], // Recruitment_Year
    row[28], // Photo_URL
    row[29], // Registration_Date
    row[31]  // Status
  ];
}

function getBranchSubset(row) {
  return [
    row[0], // Global_ID
    row[1], // Recruitment_ID
    row[3], // Full_Name
    row[8], // Gender
    row[18], // Phone_1
    row[23], // Member_Level
    row[27], // Recruitment_Year
    row[28], // Photo_URL
    row[29], // Registration_Date
    row[31], // Status
    new Date() // Last_Updated
  ];
}

// ========================
// SHEET SYNC FUNCTIONS
// ========================
function updateRelatedSheets(memberId) {
  try {
    const allSheet = getSheet('ALL_MEMBERS');
    const allData = allSheet.getDataRange().getValues();
    const headers = allData[0];
    
    const rowIndex = allData.findIndex(row => row[0] === memberId);
    
    if (rowIndex === -1) {
      logError(`Member ${memberId} not found in ALL_MEMBERS sheet`);
      return false;
    }
    
    const memberRow = allData[rowIndex];
    const type = memberRow[headers.indexOf('Type')];
    
    if (type === 'Member') {
      const membersSheet = getSheet('MEMBERS_ONLY');
      const membersData = membersSheet.getDataRange().getValues();
      const mRowIndex = membersData.findIndex(row => row[0] === memberId);
      
      if (mRowIndex > 0) {
        const memberSubset = getMemberSubset(memberRow);
        membersSheet.getRange(mRowIndex + 1, 1, 1, memberSubset.length)
          .setValues([memberSubset]);
      }
      
      const branchCode = memberRow[headers.indexOf('Branch_Code')];
      if (branchCode) {
        const branchSheetName = `BRANCH_${branchCode}`;
        const branchSheet = getSheet(branchSheetName);
        const branchData = branchSheet.getDataRange().getValues();
        const bRowIndex = branchData.findIndex(row => row[0] === memberId);
        
        if (bRowIndex > 0) {
          const branchSubset = getBranchSubset(memberRow);
          branchSheet.getRange(bRowIndex + 1, 1, 1, branchSubset.length)
            .setValues([branchSubset]);
        }
      }
    } else if (type === 'Masul') {
      const masulSheet = getSheet('MASUL_ONLY');
      const masulData = masulSheet.getDataRange().getValues();
      const mRowIndex = masulData.findIndex(row => row[0] === memberId);
      
      if (mRowIndex > 0) {
        const masulSubset = getMasulSubset(memberRow);
        masulSheet.getRange(mRowIndex + 1, 1, 1, masulSubset.length)
          .setValues([masulSubset]);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Failed to update related sheets for ${memberId}:`, error);
    return false;
  }
}

function updateBranchSheetsOnTransfer(memberId, oldBranch, newBranch) {
  try {
    const allSheet = getSheet('ALL_MEMBERS');
    const allData = allSheet.getDataRange().getValues();
    const headers = allData[0];
    
    const rowIndex = allData.findIndex(row => row[0] === memberId);
    
    if (rowIndex === -1) {
      throw new Error(`Member ${memberId} not found`);
    }
    
    const memberRow = allData[rowIndex];
    
    const oldCode = generateBranchCode(oldBranch);
    const oldSheetName = `BRANCH_${oldCode}`;
    const oldSheet = getSheet(oldSheetName);
    const oldData = oldSheet.getDataRange().getValues();
    const oldRowIndex = oldData.findIndex(row => row[0] === memberId);
    
    if (oldRowIndex > 0) {
      oldSheet.deleteRow(oldRowIndex + 1);
    }
    
    const newCode = generateBranchCode(newBranch);
    const newSheetName = `BRANCH_${newCode}`;
    const newSheet = getSheet(newSheetName);
    
    const branchSubset = getBranchSubset(memberRow);
    newSheet.appendRow(branchSubset);
    
    return true;
  } catch (error) {
    logError('Failed to update branch sheets during transfer:', error);
    throw error;
  }
}

// ========================
// SYSTEM INITIALIZATION FUNCTIONS
// ========================
function createAllSheets(ss) {
  try {
    // Store spreadsheet ID
    PropertiesService.getScriptProperties()
      .setProperty('SPREADSHEET_ID', ss.getId());
    
    const requiredSheets = [
      'ALL_MEMBERS',
      'MEMBERS_ONLY',
      'MASUL_ONLY',
      'BRANCH_COUNTERS',
      'SETTINGS',
      'PROMOTION_LOGS',
      'TRANSFER_LOGS',
      'ACTIVITY_LOGS'
    ];
    
    // Create required sheets
    requiredSheets.forEach(sheetName => {
      getSheet(sheetName);
    });
    
    // Create branch sheets using UTILS_ZONES
    const allBranches = Object.values(UTILS_ZONES).flat();
    
    allBranches.forEach(branch => {
      const branchCode = generateBranchCode(branch);
      const branchSheetName = `BRANCH_${branchCode}`;
      getSheet(branchSheetName);
      
      // Initialize branch counter
      const countersSheet = getSheet('BRANCH_COUNTERS');
      const countersData = countersSheet.getDataRange().getValues();
      const hasCounter = countersData.some(row => row[0] === branchCode);
      
      if (!hasCounter) {
        countersSheet.appendRow([branchCode, 0, new Date(), 'System']);
      }
    });
    
    // Initialize system counters
    const countersSheet = getSheet('BRANCH_COUNTERS');
    const countersData = countersSheet.getDataRange().getValues();
    
    const requiredCounters = [
      ['GLOBAL_ID_COUNTER', 0],
      ['MASUL_GLOBAL_SERIAL', 0]
    ];
    
    requiredCounters.forEach(([key, defaultValue]) => {
      const hasCounter = countersData.some(row => row[0] === key);
      
      if (!hasCounter) {
        countersSheet.appendRow([key, defaultValue, new Date(), 'System']);
      }
    });
    
    logSuccess('All sheets created successfully');
    return true;
  } catch (error) {
    logError('Failed to create all sheets:', error);
    throw error;
  }
}

function initializeSettings(ss) {
  try {
    const settingsSheet = getSheet('SETTINGS');
    const data = settingsSheet.getDataRange().getValues();
    
    const defaultSettings = [
      ['Admin_Access_Code', UTILS_CONFIG.DEFAULT_ADMIN_CODE],
      ['Masul_Access_Code', UTILS_CONFIG.DEFAULT_MASUL_CODE],
      ['System_Name', UTILS_CONFIG.SYSTEM_NAME],
      ['Version', UTILS_CONFIG.VERSION],
      ['Initialized_Date', new Date().toISOString()]
    ];
    
    defaultSettings.forEach(([key, value]) => {
      const exists = data.some(row => row[0] === key);
      
      if (!exists) {
        settingsSheet.appendRow([key, value, new Date()]);
      }
    });
    
    logSuccess('Settings initialized successfully');
    return true;
  } catch (error) {
    logError('Failed to initialize settings:', error);
    throw error;
  }
}

function createDriveFolders() {
  try {
    const rootFolder = getOrCreateFolder('IIM_Images', DriveApp.getRootFolder());
    
    // Create branch folders using UTILS_ZONES
    Object.values(UTILS_ZONES).flat().forEach(branch => {
      getOrCreateFolder(branch, rootFolder);
    });
    
    logSuccess('Drive folders structure created');
    return true;
  } catch (error) {
    logError('Failed to create Drive folders:', error);
    throw error;
  }
}

// ========================
// ACTIVITY LOGGING
// ========================
function logActivity(action, description, userRole = '', userBranch = '') {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = [
      timestamp,
      action,
      description,
      userRole,
      userBranch
    ];
    
    appendToSheet('ACTIVITY_LOGS', logEntry);
    return true;
  } catch (error) {
    logError('Failed to log activity:', error);
    return false;
  }
}

// ========================
// VALIDATION FUNCTIONS (FOR USE IN BOTH FILES)
// ========================
function utilsValidateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function utilsValidatePhone(phone) {
  return /^[0-9+\s\-\(\)]{10,15}$/.test(phone);
}

function utilsSanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// ========================
// EXPORT FUNCTIONS FOR USE IN CODE.GS
// ========================
function exportUtilsFunctions() {
  return {
    // Core functions
    getSpreadsheet,
    getSheet,
    getSheetData,
    appendToSheet,
    updateRowInSheet,
    
    // Counter functions
    getNextGlobalId,
    getNextMemberSerial,
    getNextMasulSerial,
    
    // ID generation
    generateBranchCode,
    
    // Data transformation
    getMemberSubset,
    getMasulSubset,
    getBranchSubset,
    
    // Sheet synchronization
    updateRelatedSheets,
    updateBranchSheetsOnTransfer,
    
    // Image handling
    uploadImage,
    getOrCreateFolder,
    
    // Initialization
    createAllSheets,
    initializeSettings,
    createDriveFolders,
    
    // Logging
    logToConsole,
    logError,
    logSuccess,
    logActivity,
    
    // Validation
    utilsValidateEmail,
    utilsValidatePhone,
    utilsSanitizeInput,
    
    // Constants
    UTILS_CONFIG,
    UTILS_ZONES
  };
}
