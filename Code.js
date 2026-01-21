// Code.gs - BACKEND FOR INTIZARUL IMAMUL MUNTAZAR
// COMPATIBLE WITH: Utils.gs (unchanged)

// ========================
// SYSTEM CONFIGURATION
// ========================
const CONFIG = {
  SYSTEM_NAME: 'Intizarul Imamul Muntazar',
  VERSION: '4.1.0',
  DEFAULT_ADMIN_CODE: 'Muntazirun',
  DEFAULT_MASUL_CODE: 'Muntazir'
};

// ========================
// ZONES AND BRANCHES
// ========================
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

const MEMBER_LEVELS = ['Bakiyatullah', 'Ansarullah', 'Ghalibun', 'Graduate'];
const LEVEL_HIERARCHY = {
  'Bakiyatullah': 1,
  'Ansarullah': 2,
  'Ghalibun': 3,
  'Graduate': 4
};

// ========================
// SAFE RESPONSE HELPERS
// ========================
function ok(payload = {}) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...payload
    })
  );
}

function fail(message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      message: message
    })
  );
}

// ========================
// INPUT VALIDATION
// ========================
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  return /^[0-9+\s\-\(\)]{10,15}$/.test(phone);
}

function sanitizeRequest(request) {
  for (const key in request) {
    if (typeof request[key] === 'string') {
      request[key] = sanitizeInput(request[key]);
    } else if (Array.isArray(request[key])) {
      request[key] = request[key].map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof request[key] === 'object' && request[key] !== null) {
      sanitizeRequest(request[key]);
    }
  }
}

// ========================
// HEALTH CHECK (GET)
// ========================
function doGet() {
  try {
    const props = PropertiesService.getScriptProperties();
    const initialized = props.getProperty('SYSTEM_INITIALIZED') === 'true';
    
    return ok({
      system: CONFIG.SYSTEM_NAME,
      status: 'ONLINE',
      version: CONFIG.VERSION,
      initialized: initialized,
      timestamp: new Date().toISOString(),
      sheets: {
        hasSpreadsheet: !!props.getProperty('SPREADSHEET_ID'),
        spreadsheetId: props.getProperty('SPREADSHEET_ID') || 'Not set'
      },
      zones: ZONES,
      memberLevels: MEMBER_LEVELS,
      endpoints: [
        'initializeSystem',
        'login',
        'registerMember',
        'registerMasul',
        'getStatistics',
        'getMembers',
        'getMemberDetails',
        'promoteMember',
        'transferMember',
        'getRecentActivity',
        'updateSettings',
        'exportData',
        'backupSystem',
        'getAllZonesBranches'
      ]
    });
  } catch (error) {
    console.error('GET error:', error);
    return fail(`GET error: ${error.message}`);
  }
}

// ========================
// MAIN ENTRY (POST ONLY)
// ========================
function doPost(e) {
  try {
    // Log the incoming request
    console.log('POST request received, parameters:', Object.keys(e?.parameter || {}));
    
    if (!e || !e.parameter || !e.parameter.data) {
      return fail('Invalid request format. Use FormData with "data" parameter.');
    }

    // Parse the FormData JSON
    let payload;
    try {
      payload = JSON.parse(e.parameter.data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', e.parameter.data);
      return fail('Invalid JSON in request data');
    }
    
    const action = payload.action;
    
    if (!action) {
      return fail('Action is required');
    }

    // Sanitize the request
    sanitizeRequest(payload);
    
    console.log(`Processing action: ${action}`);

    // Route to appropriate handler
    switch (action) {
      case 'initializeSystem':
        return ok(handleInitializeSystem());
      case 'login':
        return ok(handleLogin(payload));
      case 'registerMember':
        return ok(handleRegisterMember(payload));
      case 'registerMasul':
        return ok(handleRegisterMasul(payload));
      case 'getStatistics':
        return ok(handleGetStatistics());
      case 'getMembers':
        return ok(handleGetMembers(payload));
      case 'getMemberDetails':
        return ok(handleGetMemberDetails(payload));
      case 'promoteMember':
        return ok(handlePromoteMember(payload));
      case 'transferMember':
        return ok(handleTransferMember(payload));
      case 'getRecentActivity':
        return ok(handleGetRecentActivity());
      case 'updateSettings':
        return ok(handleUpdateSettings(payload));
      case 'exportData':
        return ok(handleExportData(payload));
      case 'backupSystem':
        return ok(handleBackupSystem());
      case 'getAllZonesBranches':
        return ok({ data: ZONES });
      default:
        return fail(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Global error in doPost:', error);
    return fail(`Server error: ${error.message}`);
  }
}

// ========================
// SYSTEM INITIALIZATION
// ========================
function handleInitializeSystem() {
  try {
    const props = PropertiesService.getScriptProperties();
    
    if (props.getProperty('SYSTEM_INITIALIZED') === 'true') {
      return {
        message: 'System already initialized',
        data: { initialized: true }
      };
    }
    
    const ss = SpreadsheetApp.create(`${CONFIG.SYSTEM_NAME}_Database_${new Date().getFullYear()}`);
    props.setProperty('SPREADSHEET_ID', ss.getId());
    
    // Initialize all sheets using Utils functions
    createAllSheets(ss);
    initializeSettings(ss);
    createDriveFolders();
    
    props.setProperty('SYSTEM_INITIALIZED', 'true');
    
    // Log the activity
    logToConsole('System initialized successfully');
    
    return {
      message: 'System initialized successfully',
      data: {
        spreadsheetUrl: ss.getUrl(),
        spreadsheetId: ss.getId(),
        initialized: true
      }
    };
  } catch (error) {
    logError('System initialization failed', error);
    throw new Error(`System initialization failed: ${error.message}`);
  }
}

// ========================
// LOGIN HANDLER
// ========================
function handleLogin(data) {
  try {
    const { role, accessCode, branch } = data;
    
    if (!role || !accessCode) {
      throw new Error('Role and access code are required');
    }
    
    let adminCode = CONFIG.DEFAULT_ADMIN_CODE;
    let masulCode = CONFIG.DEFAULT_MASUL_CODE;
    
    // Try to get codes from settings
    try {
      const settings = getSheetData('SETTINGS');
      const adminRow = settings.find(row => row[0] === 'Admin_Access_Code');
      const masulRow = settings.find(row => row[0] === 'Masul_Access_Code');
      
      if (adminRow) adminCode = adminRow[1];
      if (masulRow) masulCode = masulRow[1];
    } catch (e) {
      console.log('Using default access codes');
    }
    
    if (role === 'admin') {
      if (accessCode !== adminCode) {
        throw new Error('Invalid admin access code');
      }
      
      logToConsole(`Admin logged in successfully`);
      return {
        message: 'Login successful',
        data: {
          role: 'admin',
          branch: 'System',
          timestamp: new Date().toISOString()
        }
      };
    } else if (role === 'masul') {
      if (accessCode !== masulCode) {
        throw new Error('Invalid masul access code');
      }
      
      if (!branch) {
        throw new Error('Branch is required for masul login');
      }
      
      // Validate branch exists
      const allBranches = Object.values(ZONES).flat();
      if (!allBranches.includes(branch)) {
        throw new Error('Invalid branch selected');
      }
      
      logToConsole(`Masul logged in from ${branch} successfully`);
      return {
        message: 'Login successful',
        data: {
          role: 'masul',
          branch: branch,
          branchCode: generateBranchCode(branch),
          timestamp: new Date().toISOString()
        }
      };
    } else {
      throw new Error('Invalid role');
    }
  } catch (error) {
    logError('Login failed', error);
    throw new Error(`Login failed: ${error.message}`);
  }
}

// ========================
// MEMBER REGISTRATION
// ========================
function handleRegisterMember(data) {
  try {
    // Authorization check
    const userRole = data.userRole;
    if (userRole === 'masul' && data.branch !== data.userBranch) {
      throw new Error('Branch Masul can only register members in their own branch');
    }
    
    // Validate required fields
    const requiredFields = [
      'fullName', 'firstName', 'fatherName', 'birthDate', 'gender',
      'residentialAddress', 'phone1', 'memberLevel', 'zone', 'branch',
      'recruitmentYear'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate phone
    if (!validatePhone(data.phone1)) {
      throw new Error('Invalid phone number format');
    }
    
    if (data.phone2 && !validatePhone(data.phone2)) {
      throw new Error('Invalid secondary phone number format');
    }
    
    // Check age - FIXED: Changed from 10 to 8 years
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxAge = new Date(today.getFullYear() - 8, today.getMonth(), today.getDate()); // FIXED: Changed from 10 to 8
    
    if (birthDate < minAge || birthDate > maxAge) {
      throw new Error('Age must be between 8 and 100 years');
    }
    
    // Check for duplicates
    const allData = getSheetData('ALL_MEMBERS');
    const isDuplicate = allData.some(row => 
      row[18] === data.phone1 || 
      (row[3] === data.fullName && row[5] === data.fatherName)
    );
    
    if (isDuplicate) {
      throw new Error('Member already registered with same phone or name');
    }
    
    // Generate IDs using Utils functions
    const globalId = getNextGlobalId(userRole || 'System');
    const branchCode = generateBranchCode(data.branch);
    const memberSerial = getNextMemberSerial(branchCode, userRole || 'System');
    const recruitmentId = `INT/${branchCode}/${data.recruitmentYear}/${memberSerial.toString().padStart(3, '0')}`;
    
    // Upload photo if provided
    let photoUrl = '';
    if (data.photoBase64) {
      photoUrl = uploadImage(data.photoBase64, data.branch, data.recruitmentYear);
    }
    
    // Prepare row
    const row = [
      globalId,                    // Global_ID
      recruitmentId,              // Recruitment_ID
      'Member',                   // Type
      data.fullName,              // Full_Name
      data.firstName,             // First_Name
      data.fatherName,            // Father_Name
      data.grandfatherName || '', // Grandfather_Name
      data.birthDate,             // Birth_Date
      data.gender,                // Gender
      data.residentialAddress,    // Residential_Address
      data.neighborhood || '',    // Neighborhood
      data.localGovernment || '', // Local_Government
      data.state || '',           // State
      data.parentsGuardians || '', // Parents_Guardians
      data.parentAddress || '',   // Parent_Address
      data.parentNeighborhood || '', // Parent_Neighborhood
      data.parentLGA || '',       // Parent_LGA
      data.parentState || '',     // Parent_State
      data.phone1,                // Phone_1
      data.phone2 || '',          // Phone_2
      '',                         // Email
      '',                         // Education_Level
      '',                         // Course_Studying
      data.memberLevel,           // Member_Level
      data.zone,                  // Zone
      data.branch,                // Branch
      branchCode,                 // Branch_Code
      data.recruitmentYear,       // Recruitment_Year
      photoUrl,                   // Photo_URL
      new Date().toISOString(),   // Registration_Date
      new Date().toISOString(),   // Last_Updated
      'Active',                   // Status
      ''                          // Notes
    ];
    
    // Append to sheets using Utils functions
    appendToSheet('ALL_MEMBERS', row, userRole || 'System');
    appendToSheet('MEMBERS_ONLY', getMemberSubset(row), userRole || 'System');
    appendToSheet(`BRANCH_${branchCode}`, getBranchSubset(row), userRole || 'System');
    
    // Log activity
    logToConsole(`Registered member ${globalId} (${data.fullName}) in ${data.branch}`);
    
    return {
      message: 'Member registered successfully',
      data: {
        globalId: globalId,
        recruitmentId: recruitmentId,
        fullName: data.fullName,
        branch: data.branch,
        level: data.memberLevel,
        photoUrl: photoUrl,
        date: new Date().toISOString()
      }
    };
  } catch (error) {
    logError('Member registration failed', error);
    throw new Error(`Member registration failed: ${error.message}`);
  }
}

// ========================
// MAS'UL REGISTRATION
// ========================
function handleRegisterMasul(data) {
  try {
    // Validate required fields
    const requiredFields = [
      'fullName', 'fatherName', 'birthDate', 'email', 'phone1',
      'educationLevel', 'residentialAddress', 'zone', 'branch',
      'recruitmentYear'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate email and phone
    if (!validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!validatePhone(data.phone1)) {
      throw new Error('Invalid phone number format');
    }
    
    if (!data.declaration) {
      throw new Error('Declaration/commitment must be accepted');
    }
    
    // ADDED: Validate age for Mas'ul (8-100 years)
    const masulBirthDate = new Date(data.birthDate);
    const masulToday = new Date();
    const masulMinAge = new Date(masulToday.getFullYear() - 100, masulToday.getMonth(), masulToday.getDate());
    const masulMaxAge = new Date(masulToday.getFullYear() - 8, masulToday.getMonth(), masulToday.getDate());
    
    if (masulBirthDate < masulMinAge || masulBirthDate > masulMaxAge) {
      throw new Error('Masul age must be between 8 and 100 years');
    }
    
    // Check for duplicates
    const allData = getSheetData('ALL_MEMBERS');
    const isDuplicate = allData.some(row => 
      row[20] === data.email || 
      row[18] === data.phone1
    );
    
    if (isDuplicate) {
      throw new Error('Masul already registered with same email or phone');
    }
    
    // Generate IDs
    const globalId = getNextGlobalId('admin');
    const branchCode = generateBranchCode(data.branch);
    const masulSerial = getNextMasulSerial('admin');
    const recruitmentId = `IIM/${branchCode}/${data.recruitmentYear}/${masulSerial.toString().padStart(3, '0')}`;
    
    // Upload photo if provided
    let photoUrl = '';
    if (data.photoBase64) {
      photoUrl = uploadImage(data.photoBase64, data.branch, data.recruitmentYear);
    }
    
    // Prepare row
    const row = [
      globalId,                          // Global_ID
      recruitmentId,                    // Recruitment_ID
      'Masul',                          // Type
      data.fullName,                    // Full_Name
      '',                               // First_Name
      data.fatherName,                  // Father_Name
      '',                               // Grandfather_Name
      data.birthDate,                   // Birth_Date
      data.gender || '',                // Gender - FIXED: Added gender field
      data.residentialAddress,          // Residential_Address
      '',                               // Neighborhood
      '',                               // Local_Government
      '',                               // State
      '',                               // Parents_Guardians
      '',                               // Parent_Address
      '',                               // Parent_Neighborhood
      '',                               // Parent_LGA
      '',                               // Parent_State
      data.phone1,                      // Phone_1
      data.phone2 || '',                // Phone_2
      data.email,                       // Email
      data.educationLevel,              // Education_Level
      data.courseStudying || '',        // Course_Studying
      '',                               // Member_Level
      data.zone,                        // Zone
      data.branch,                      // Branch
      branchCode,                       // Branch_Code
      data.recruitmentYear,             // Recruitment_Year
      photoUrl,                         // Photo_URL
      new Date().toISOString(),         // Registration_Date
      new Date().toISOString(),         // Last_Updated
      'Active',                         // Status
      'Declared'                        // Notes
    ];
    
    // Append to sheets
    appendToSheet('ALL_MEMBERS', row, 'admin');
    appendToSheet('MASUL_ONLY', getMasulSubset(row), 'admin');
    
    // Log activity
    logToConsole(`Registered Masul ${globalId} (${data.fullName}) in ${data.branch}`);
    
    return {
      message: 'Masul registered successfully',
      data: {
        globalId: globalId,
        recruitmentId: recruitmentId,
        fullName: data.fullName,
        branch: data.branch,
        email: data.email,
        photoUrl: photoUrl,
        date: new Date().toISOString()
      }
    };
  } catch (error) {
    logError('Masul registration failed', error);
    throw new Error(`Masul registration failed: ${error.message}`);
  }
}

// ========================
// STATISTICS
// ========================
function handleGetStatistics() {
  try {
    const allData = getSheetData('ALL_MEMBERS');
    const members = allData.filter(row => row[2] === 'Member' && row[31] === 'Active');
    const masul = allData.filter(row => row[2] === 'Masul' && row[31] === 'Active');
    
    const totalMembers = members.length;
    const totalMasul = masul.length;
    const brothers = members.filter(row => row[8] === 'Brother').length;
    const sisters = members.filter(row => row[8] === 'Sister').length;
    
    const membersPerBranch = {};
    const membersPerLevel = {};
    const membersPerZone = {};
    
    members.forEach(row => {
      const branch = row[25];
      const zone = row[24];
      const level = row[23];
      
      membersPerBranch[branch] = (membersPerBranch[branch] || 0) + 1;
      membersPerZone[zone] = (membersPerZone[zone] || 0) + 1;
      membersPerLevel[level] = (membersPerLevel[level] || 0) + 1;
    });
    
    // Recent members (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMembers = members.filter(row => {
      const regDate = new Date(row[29]);
      return regDate >= thirtyDaysAgo;
    }).length;
    
    return {
      data: {
        totalMembers,
        totalMasul,
        brothers,           // FIXED: Added brothers
        sisters,           // FIXED: Added sisters
        recentMembers,
        membersPerBranch,
        membersPerZone,
        membersPerLevel,
        totalBranches: Object.keys(membersPerBranch).length,
        totalZones: Object.keys(ZONES).length
      }
    };
  } catch (error) {
    logError('Failed to get statistics', error);
    throw new Error(`Failed to get statistics: ${error.message}`);
  }
}

// ========================
// GET MEMBERS WITH FILTERS
// ========================
function handleGetMembers(data) {
  try {
    // Check if we're looking for masul or members
    const isMasul = data.type === 'masul';
    let members = [];
    
    if (isMasul) {
      // Get from MASUL_ONLY sheet
      const masulData = getSheetData('MASUL_ONLY');
      // MASUL_ONLY columns: [Global_ID, Recruitment_ID, Full_Name, Email, Phone_1, Zone, Branch, Recruitment_Year, Photo_URL, Registration_Date, Status]
      
      members = masulData.map(row => ({
        id: row[0],
        recruitmentId: row[1],
        fullName: row[2],
        email: row[3],
        phone: row[4],
        zone: row[5],
        branch: row[6],
        recruitmentYear: row[7],
        photoUrl: row[8],
        registrationDate: row[9],
        status: row[10]
      }));
    } else {
      // Get from MEMBERS_ONLY sheet
      const membersData = getSheetData('MEMBERS_ONLY');
      // MEMBERS_ONLY columns: [Global_ID, Recruitment_ID, Full_Name, Gender, Phone_1, Member_Level, Recruitment_Year, Zone, Branch, Photo_URL, Registration_Date, Status]
      
      members = membersData.map(row => ({
        id: row[0],
        recruitmentId: row[1],
        fullName: row[2],
        gender: row[3],
        phone: row[4],
        level: row[5],
        recruitmentYear: row[6],
        zone: row[7],
        branch: row[8],
        photoUrl: row[9],
        registrationDate: row[10],
        status: row[11]
      }));
    }
    
    // Apply filters if provided
    if (data.zone) {
      members = members.filter(m => m.zone === data.zone);
    }
    
    if (data.branch) {
      members = members.filter(m => m.branch === data.branch);
    }
    
    if (data.level && !isMasul) {
      members = members.filter(m => m.level === data.level);
    }
    
    if (data.gender && !isMasul) {
      members = members.filter(m => m.gender === data.gender);
    }
    
    if (data.search) {
      const searchLower = data.search.toLowerCase();
      members = members.filter(m => 
        m.fullName.toLowerCase().includes(searchLower) ||
        m.id.includes(data.search) ||
        m.recruitmentId.includes(data.search)
      );
    }
    
    return {
      data: members,
      count: members.length
    };
  } catch (error) {
    logError('Failed to get members', error);
    throw new Error(`Failed to get members: ${error.message}`);
  }
}

// ========================
// GET MEMBER DETAILS
// ========================
function handleGetMemberDetails(data) {
  try {
    const { memberId } = data;
    
    if (!memberId) {
      throw new Error('Member ID is required');
    }
    
    const allData = getSheetData('ALL_MEMBERS');
    const member = allData.find(row => row[0] === memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    const headers = getHeadersForSheet('ALL_MEMBERS');
    const memberDetails = {};
    
    headers.forEach((header, index) => {
      memberDetails[header] = member[index] || '';
    });
    
    return {
      data: memberDetails
    };
  } catch (error) {
    logError('Failed to get member details', error);
    throw new Error(`Failed to get member details: ${error.message}`);
  }
}

// ========================
// PROMOTE MEMBER
// ========================
function handlePromoteMember(data) {
  try {
    const { memberId, newLevel, notes = '', userRole } = data;
    
    if (!memberId || !newLevel) {
      throw new Error('Member ID and new level are required');
    }
    
    if (!MEMBER_LEVELS.includes(newLevel)) {
      throw new Error(`Invalid level. Must be one of: ${MEMBER_LEVELS.join(', ')}`);
    }
    
    // Get current member details
    const allData = getSheetData('ALL_MEMBERS');
    const member = allData.find(row => row[0] === memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    const oldLevel = member[23]; // Member_Level index
    const fullName = member[3]; // Full_Name index
    
    // Check promotion validity
    const oldIndex = LEVEL_HIERARCHY[oldLevel];
    const newIndex = LEVEL_HIERARCHY[newLevel];
    
    if (newIndex <= oldIndex) {
      throw new Error(`Cannot promote from ${oldLevel} to ${newLevel}`);
    }
    
    // Update the member level
    updateRowInSheet('ALL_MEMBERS', memberId, 'Global_ID', {
      'Member_Level': newLevel,
      'Last_Updated': new Date()
    }, userRole || 'System');
    
    // Update related sheets
    updateRelatedSheets(memberId);
    
    // Log promotion
    appendToSheet('PROMOTION_LOGS', [
      memberId,
      oldLevel,
      newLevel,
      new Date(),
      userRole || 'Admin',
      notes || 'Level promotion',
      fullName
    ], userRole || 'System');
    
    logToConsole(`Promoted member ${memberId} from ${oldLevel} to ${newLevel}`);
    
    return {
      message: 'Member promoted successfully',
      data: {
        memberId,
        oldLevel,
        newLevel,
        date: new Date().toISOString()
      }
    };
  } catch (error) {
    logError('Promotion failed', error);
    throw new Error(`Promotion failed: ${error.message}`);
  }
}

// ========================
// TRANSFER MEMBER
// ========================
function handleTransferMember(data) {
  try {
    const { memberId, newBranch, notes = '', userRole } = data;
    
    if (!memberId || !newBranch) {
      throw new Error('Member ID and new branch are required');
    }
    
    const allBranches = Object.values(ZONES).flat();
    if (!allBranches.includes(newBranch)) {
      throw new Error('Invalid branch');
    }
    
    // Get current member details
    const allData = getSheetData('ALL_MEMBERS');
    const member = allData.find(row => row[0] === memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }
    
    const oldBranch = member[25]; // Branch index
    const fullName = member[3]; // Full_Name index
    
    if (oldBranch === newBranch) {
      throw new Error('Member is already in this branch');
    }
    
    const newBranchCode = generateBranchCode(newBranch);
    
    // Update the member's branch
    updateRowInSheet('ALL_MEMBERS', memberId, 'Global_ID', {
      'Branch': newBranch,
      'Branch_Code': newBranchCode,
      'Last_Updated': new Date()
    }, userRole || 'System');
    
    // Update branch sheets
    updateBranchSheetsOnTransfer(memberId, oldBranch, newBranch);
    updateRelatedSheets(memberId);
    
    // Log transfer
    appendToSheet('TRANSFER_LOGS', [
      memberId,
      oldBranch,
      newBranch,
      new Date(),
      userRole || 'Admin',
      notes || 'Branch transfer',
      fullName
    ], userRole || 'System');
    
    logToConsole(`Transferred member ${memberId} from ${oldBranch} to ${newBranch}`);
    
    return {
      message: 'Member transferred successfully',
      data: {
        memberId,
        oldBranch,
        newBranch,
        date: new Date().toISOString()
      }
    };
  } catch (error) {
    logError('Transfer failed', error);
    throw new Error(`Transfer failed: ${error.message}`);
  }
}

// ========================
// RECENT ACTIVITY
// ========================
function handleGetRecentActivity() {
  try {
    const logs = getSheetData('ACTIVITY_LOGS');
    
    const recentLogs = logs
      .slice(-50)
      .reverse()
      .map(row => ({
        timestamp: row[0],
        action: row[1],
        description: row[2],
        userRole: row[3],
        userBranch: row[4]
      }));
    
    return {
      data: recentLogs,
      count: recentLogs.length
    };
  } catch (error) {
    logError('Failed to get activity logs', error);
    throw new Error(`Failed to get activity logs: ${error.message}`);
  }
}

// ========================
// UPDATE SETTINGS
// ========================
function handleUpdateSettings(data) {
  try {
    const { adminAccessCode, masulAccessCode } = data;
    
    if (!adminAccessCode && !masulAccessCode) {
      throw new Error('No settings provided to update');
    }
    
    if (adminAccessCode) {
      updateRowInSheet('SETTINGS', 'Admin_Access_Code', 'Setting', {
        'Value': adminAccessCode
      }, 'admin');
    }
    
    if (masulAccessCode) {
      updateRowInSheet('SETTINGS', 'Masul_Access_Code', 'Setting', {
        'Value': masulAccessCode
      }, 'admin');
    }
    
    logToConsole('Settings updated');
    
    return {
      message: 'Settings updated successfully',
      data: {
        adminAccessCodeUpdated: !!adminAccessCode,
        masulAccessCodeUpdated: !!masulAccessCode
      }
    };
  } catch (error) {
    logError('Failed to update settings', error);
    throw new Error(`Failed to update settings: ${error.message}`);
  }
}

// ========================
// EXPORT DATA
// ========================
function handleExportData(data) {
  try {
    const { type, format = 'csv' } = data;
    
    let sheetName;
    let fileName;
    
    switch (type) {
      case 'members':
        sheetName = 'MEMBERS_ONLY';
        fileName = `IIM_Members_Export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'masul':
        sheetName = 'MASUL_ONLY';
        fileName = `IIM_Masul_Export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'all':
        sheetName = 'ALL_MEMBERS';
        fileName = `IIM_Complete_Export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        throw new Error('Invalid export type');
    }
    
    const sheet = getSheet(sheetName);
    const sheetData = sheet.getDataRange().getValues();
    
    const csvContent = sheetData.map(row => 
      row.map(cell => {
        const cellStr = cell.toString();
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    const blob = Utilities.newBlob(csvContent, 'text/csv', `${fileName}.csv`);
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    logToConsole(`Exported ${type} data: ${fileName}`);
    
    return {
      message: 'Export completed successfully',
      data: {
        downloadUrl: file.getDownloadUrl(),
        viewUrl: file.getUrl(),
        fileName: file.getName(),
        fileSize: file.getSize()
      }
    };
  } catch (error) {
    logError('Export failed', error);
    throw new Error(`Export failed: ${error.message}`);
  }
}

// ========================
// BACKUP SYSTEM
// ========================
function handleBackupSystem() {
  try {
    const ss = getSpreadsheet();
    const backupName = `${CONFIG.SYSTEM_NAME}_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    const backup = ss.copy(backupName);
    backup.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    logToConsole(`Created system backup: ${backupName}`);
    
    return {
      message: 'Backup created successfully',
      data: {
        backupUrl: backup.getUrl(),
        backupId: backup.getId(),
        backupName: backupName,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logError('Backup failed', error);
    throw new Error(`Backup failed: ${error.message}`);
  }
}

// ========================
// HELPER FUNCTION
// ========================
function canPromote(oldLevel, newLevel) {
  if (!MEMBER_LEVELS.includes(oldLevel) || !MEMBER_LEVELS.includes(newLevel)) {
    return false;
  }
  
  const oldIndex = LEVEL_HIERARCHY[oldLevel];
  const newIndex = LEVEL_HIERARCHY[newLevel];
  
  return newIndex > oldIndex;
}
