/**
 * INTIZARUL IMAMUL MUNTAZAR – Backend
 * All endpoints are exposed via doPost/doGet with CORS.
 */

function doPost(e) {
  return handleRequest(e);
}
function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Create a text output with CORS headers
  const output = ContentService.createTextOutput();
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (e && e.postData === undefined) {
    return output.setContent(''); // empty body, but headers are set
  }

  try {
    ensureSheetsExist(); // auto-create sheets and preload data

    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    let result;

    switch (action) {
      case 'login':
        result = login(params.role, params.code);
        break;
      case 'registerMember':
        result = registerMember(params.data, params.user);
        break;
      case 'registerMasul':
        result = registerMasul(params.data, params.user);
        break;
      case 'getMembers':
        result = getMembers(params.user, params.page, params.pageSize);
        break;
      case 'getMasuls':
        result = getMasuls(params.user, params.page, params.pageSize);
        break;
      case 'getZones':
        result = getZones(params.user);
        break;
      case 'getBranches':
        result = getBranches(params.user, params.zone);
        break;
      case 'promoteMember':
        result = promoteMember(params.intizarId, params.user);
        break;
      case 'promoteMasul':
        result = promoteMasul(params.intizarId, params.user);
        break;
      case 'transferMember':
        result = transferMember(params.intizarId, params.newBranchCode, params.user);
        break;
      case 'transferMasul':
        result = transferMasul(params.intizarId, params.newBranchCode, params.user);
        break;
      case 'addZone':
        result = addZone(params.zoneName, params.user);
        break;
      case 'editZone':
        result = editZone(params.zoneId, params.newName, params.user);
        break;
      case 'disableZone':
        result = disableZone(params.zoneId, params.user);
        break;
      case 'enableZone':
        result = enableZone(params.zoneId, params.user);
        break;
      case 'addBranch':
        result = addBranch(params.branchName, params.zoneName, params.user);
        break;
      case 'editBranch':
        result = editBranch(params.branchCode, params.newName, params.newZone, params.user);
        break;
      case 'disableBranch':
        result = disableBranch(params.branchCode, params.user);
        break;
      case 'enableBranch':
        result = enableBranch(params.branchCode, params.user);
        break;
      case 'getAuditLog':
        result = getAuditLog(params.user);
        break;
      case 'getConfig':
        result = getConfig(params.key, params.user);
        break;
      case 'updateConfig':
        result = updateConfig(params.key, params.value, params.user);
        break;
      case 'exportData':
        result = exportData(params.type, params.user);
        break;
      case 'getMember':
        result = getMember(params.intizarId, params.user);
        break;
      case 'getMasul':
        result = getMasul(params.intizarId, params.user);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }

    output.setContent(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    logAudit('SYSTEM', 'ERROR', err.toString());
    return output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }
} action);
    }

    output.setContent(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    logAudit('SYSTEM', 'ERROR', err.toString());
    return output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }
}e || !guardianPhone ||
      !guardianAddress || !zoneName || !branchName || !yearOfRecruitment || !entryLevel)
    return sendError('Missing required fields', 400);

  if (calculateAge(dob) < 7) return sendError('Member must be at least 7 years old', 400);

  const allowedEntry = ['Bakiyatullah', 'Ansarullah', 'Ghalibun'];
  if (!allowedEntry.includes(entryLevel))
    return sendError('Entry level must be Bakiyatullah, Ansarullah, or Ghalibun', 400);

  if (token.role === 'Branch Mas\'ul' && token.branchName !== branchName)
    return sendError('You can only register members in your own branch', 403);

  const zone = getZone(zoneName);
  if (!zone || zone.status !== 'Active') return sendError('Invalid or inactive zone', 400);
  const branch = getBranch(branchName);
  if (!branch || branch.status !== 'Active' || branch.zoneName !== zoneName)
    return sendError('Invalid or inactive branch for this zone', 400);

  const intizarId = generateIntizarID();
  const memberRecruitmentId = generateMemberRecruitmentID(branch.branchCode, yearOfRecruitment);
  let photoUrl = '';
  if (photoBase64) photoUrl = savePhoto(photoBase64, intizarId);

  const membersSheet = getSheet('Members');
  membersSheet.appendRow([
    intizarId, memberRecruitmentId, fullName, fatherName, gender, dob, birthPlace,
    phone, email || '', address, stateOfOrigin, lga, zoneName, branchName,
    yearOfRecruitment, entryLevel, entryLevel, photoUrl, 'FALSE', '', 'Active', new Date()
  ]);

  logAudit('REGISTER_MEMBER', token.role, token.branchCode || token.zoneName || 'Admin',
    `Registered ${fullName} (${intizarId})`);
  return sendSuccess({ intizarId, memberRecruitmentId });
}

// ----- Mas'ul Registration -----
function handleRegisterMasul(params, token) {
  if (token.role !== 'Admin') return sendError('Only Admin can register Mas\'ul', 403);

  const { fullName, fatherName, gender, dob, birthPlace, phone, email, address,
          stateOfOrigin, lga, zoneName, branchName, yearOfRecruitment, currentRank,
          source, existingIntizarId, photoBase64 } = params;

  if (!fullName || !fatherName || !gender || !dob || !birthPlace || !phone ||
      !address || !stateOfOrigin || !lga || !zoneName || !branchName ||
      !yearOfRecruitment || !currentRank || !source)
    return sendError('Missing required fields', 400);

  if (calculateAge(dob) < 18) return sendError('Mas\'ul must be at least 18 years old', 400);

  const brotherEntry = ['Musa\'id', 'Areef', 'Muqaddam'];
  const sisterEntry = ['Musa\'ida', 'Areefa', 'Muqadama'];
  let allowed = gender === 'Brother' ? brotherEntry : (gender === 'Sister' ? sisterEntry : null);
  if (!allowed || !allowed.includes(currentRank))
    return sendError(`Entry rank for ${gender} must be one of: ${allowed.join(', ')}`, 400);

  const zone = getZone(zoneName);
  if (!zone || zone.status !== 'Active') return sendError('Invalid or inactive zone', 400);
  const branch = getBranch(branchName);
  if (!branch || branch.status !== 'Active' || branch.zoneName !== zoneName)
    return sendError('Invalid or inactive branch for this zone', 400);

  let intizarId, memberRecruitmentId = '', existingMember = null;
  let photoUrl = photoBase64 ? savePhoto(photoBase64, 'temp') : ''; // will update later if needed

  if (source === 'X-Ghalibun') {
    if (!existingIntizarId) return sendError('Existing Intizar ID required', 400);
    existingMember = findMemberByIntizarId(existingIntizarId);
    if (!existingMember) return sendError('Member not found', 400);
    if (existingMember.currentLevel !== 'X-Ghalibun') return sendError('Member is not X-Ghalibun', 400);
    if (existingMember.isMasul === 'TRUE') return sendError('Member is already a Mas\'ul', 400);
    intizarId = existingIntizarId;
    memberRecruitmentId = existingMember.recruitmentId;
  } else {
    intizarId = generateIntizarID();
  }

  const masulRecruitmentId = generateMasulRecruitmentID(branch.branchCode, yearOfRecruitment);

  const masulsSheet = getSheet('Masuls');
  masulsSheet.appendRow([
    intizarId, masulRecruitmentId, fullName, fatherName, gender, dob, birthPlace,
    phone, email || '', address, stateOfOrigin, lga, zoneName, branchName,
    yearOfRecruitment, currentRank, source, photoUrl, 'Active', new Date()
  ]);

  if (source === 'X-Ghalibun') {
    updateMemberMasulStatus(intizarId, masulRecruitmentId);
  }

  logAudit('REGISTER_MASUL', 'Admin', 'Admin',
    `Registered Mas'ul ${fullName} (${intizarId}) from source ${source}`);
  return sendSuccess({ intizarId, masulRecruitmentId, memberRecruitmentId });
}

// ----- Get Members (filtered by role) -----
function handleGetMembers(params, token) {
  const membersSheet = getSheet('Members');
  const data = membersSheet.getDataRange().getValues();
  const headers = data.shift();
  let members = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  if (token.role === 'Branch Mas\'ul')
    members = members.filter(m => m.branchName === token.branchName && m.status === 'Active');
  else if (token.role === 'Zonal Mas\'ul')
    members = members.filter(m => m.zoneName === token.zoneName && m.status === 'Active');

  return sendSuccess(members);
}

// ----- Get Mas'uls (Admin only) -----
function handleGetMasuls(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const masulsSheet = getSheet('Masuls');
  const data = masulsSheet.getDataRange().getValues();
  const headers = data.shift();
  const masuls = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return sendSuccess(masuls);
}

// ----- Get Member Details (with history) -----
function handleGetMemberDetails(params, token) {
  const { intizarId } = params;
  if (!intizarId) return sendError('Intizar ID required', 400);
  const member = findMemberByIntizarId(intizarId);
  if (!member) return sendError('Member not found', 400);

  if (token.role === 'Branch Mas\'ul' && member.branchName !== token.branchName)
    return sendError('Permission denied', 403);
  if (token.role === 'Zonal Mas\'ul' && member.zoneName !== token.zoneName)
    return sendError('Permission denied', 403);

  const promSheet = getSheet('PromotionHistory');
  const promData = promSheet.getDataRange().getValues();
  const promHeaders = promData.shift();
  const promotions = promData.filter(r => r[0] === intizarId).map(r => {
    let obj = {};
    promHeaders.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  const transSheet = getSheet('TransferHistory');
  const transData = transSheet.getDataRange().getValues();
  const transHeaders = transData.shift();
  const transfers = transData.filter(r => r[0] === intizarId).map(r => {
    let obj = {};
    transHeaders.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  return sendSuccess({ member, promotions, transfers });
}

// ----- Promote Member -----
function handlePromoteMember(params, token) {
  const { intizarId, newLevel } = params;
  if (!intizarId || !newLevel) return sendError('Missing parameters', 400);

  const member = findMemberByIntizarId(intizarId);
  if (!member) return sendError('Member not found', 400);

  if (token.role === 'Admin') {
    // ok
  } else if (token.role === 'Zonal Mas\'ul') {
    if (member.zoneName !== token.zoneName) return sendError('Can only promote in your zone', 403);
  } else {
    return sendError('Permission denied', 403);
  }

  const levelOrder = ['Bakiyatullah', 'Ansarullah', 'Ghalibun', 'X-Ghalibun'];
  const currentIdx = levelOrder.indexOf(member.currentLevel);
  const newIdx = levelOrder.indexOf(newLevel);
  if (currentIdx === -1 || newIdx === -1) return sendError('Invalid level', 400);
  if (newIdx !== currentIdx + 1) return sendError('Can only promote to the next level', 400);

  const membersSheet = getSheet('Members');
  const data = membersSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === intizarId);
  if (rowIndex === -1) return sendError('Member not found', 400);
  const currentLevelCol = headers.indexOf('currentLevel') + 1;
  membersSheet.getRange(rowIndex + 2, currentLevelCol).setValue(newLevel);

  const promSheet = getSheet('PromotionHistory');
  promSheet.appendRow([intizarId, member.currentLevel, newLevel,
    token.role + ':' + (token.branchCode || token.zoneName || 'Admin'), new Date()]);

  logAudit('PROMOTE_MEMBER', token.role, token.branchCode || token.zoneName || 'Admin',
    `Promoted ${intizarId} from ${member.currentLevel} to ${newLevel}`);
  return sendSuccess({ message: 'Member promoted' });
}

// ----- Promote Mas'ul -----
function handlePromoteMasul(params, token) {
  if (token.role !== 'Admin') return sendError('Only Admin can promote Mas\'ul', 403);
  const { intizarId, newRank } = params;
  if (!intizarId || !newRank) return sendError('Missing parameters', 400);

  const masul = findMasulByIntizarId(intizarId);
  if (!masul) return sendError('Mas\'ul not found', 400);

  const brotherRanks = ['Musa\'id', 'Areef', 'Muqaddam', 'Ra\'id', 'Raqeeb', 'Mulazim', 'Muhafiz', 'Ameed', 'Aqeeda', 'Qaid'];
  const sisterRanks = ['Musa\'ida', 'Areefa', 'Muqadama', 'Ra\'ida', 'Raqeeba', 'Mulazima', 'Muhafiza', 'Ameeda', 'Aqeeda', 'Qaida'];
  const rankOrder = masul.gender === 'Brother' ? brotherRanks : (masul.gender === 'Sister' ? sisterRanks : null);
  if (!rankOrder) return sendError('Invalid gender', 400);

  const currentIdx = rankOrder.indexOf(masul.currentRank);
  const newIdx = rankOrder.indexOf(newRank);
  if (currentIdx === -1 || newIdx === -1) return sendError('Invalid rank', 400);
  if (newIdx !== currentIdx + 1) return sendError('Can only promote to the next rank', 400);

  const masulsSheet = getSheet('Masuls');
  const data = masulsSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === intizarId);
  if (rowIndex === -1) return sendError('Mas\'ul not found', 400);
  const rankCol = headers.indexOf('currentRank') + 1;
  masulsSheet.getRange(rowIndex + 2, rankCol).setValue(newRank);

  const promSheet = getSheet('PromotionHistory');
  promSheet.appendRow([intizarId, masul.currentRank, newRank, 'Admin', new Date()]);

  logAudit('PROMOTE_MASUL', 'Admin', 'Admin', `Promoted Mas'ul ${intizarId} from ${masul.currentRank} to ${newRank}`);
  return sendSuccess({ message: 'Mas\'ul promoted' });
}

// ----- Transfer Member -----
function handleTransferMember(params, token) {
  if (token.role !== 'Admin') return sendError('Only Admin can transfer members', 403);
  const { intizarId, newZoneName, newBranchName } = params;
  if (!intizarId || !newZoneName || !newBranchName) return sendError('Missing parameters', 400);

  const member = findMemberByIntizarId(intizarId);
  if (!member) return sendError('Member not found', 400);

  const zone = getZone(newZoneName);
  if (!zone || zone.status !== 'Active') return sendError('Invalid or inactive zone', 400);
  const branch = getBranch(newBranchName);
  if (!branch || branch.status !== 'Active' || branch.zoneName !== newZoneName)
    return sendError('Invalid or inactive branch for this zone', 400);

  const membersSheet = getSheet('Members');
  const data = membersSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === intizarId);
  if (rowIndex === -1) return sendError('Member not found', 400);
  const zoneCol = headers.indexOf('zoneName') + 1;
  const branchCol = headers.indexOf('branchName') + 1;
  membersSheet.getRange(rowIndex + 2, zoneCol).setValue(newZoneName);
  membersSheet.getRange(rowIndex + 2, branchCol).setValue(newBranchName);

  const transSheet = getSheet('TransferHistory');
  transSheet.appendRow([intizarId, member.branchName, newBranchName, 'Admin', new Date()]);

  logAudit('TRANSFER_MEMBER', 'Admin', 'Admin', `Transferred ${intizarId} from ${member.branchName} to ${newBranchName}`);
  return sendSuccess({ message: 'Member transferred' });
}

// ----- Transfer Mas'ul -----
function handleTransferMasul(params, token) {
  if (token.role !== 'Admin') return sendError('Only Admin can transfer Mas\'ul', 403);
  const { intizarId, newZoneName, newBranchName } = params;
  if (!intizarId || !newZoneName || !newBranchName) return sendError('Missing parameters', 400);

  const masul = findMasulByIntizarId(intizarId);
  if (!masul) return sendError('Mas\'ul not found', 400);

  const zone = getZone(newZoneName);
  if (!zone || zone.status !== 'Active') return sendError('Invalid or inactive zone', 400);
  const branch = getBranch(newBranchName);
  if (!branch || branch.status !== 'Active' || branch.zoneName !== newZoneName)
    return sendError('Invalid or inactive branch for this zone', 400);

  const masulsSheet = getSheet('Masuls');
  const data = masulsSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === intizarId);
  if (rowIndex === -1) return sendError('Mas\'ul not found', 400);
  const zoneCol = headers.indexOf('zoneName') + 1;
  const branchCol = headers.indexOf('branchName') + 1;
  masulsSheet.getRange(rowIndex + 2, zoneCol).setValue(newZoneName);
  masulsSheet.getRange(rowIndex + 2, branchCol).setValue(newBranchName);

  const transSheet = getSheet('TransferHistory');
  transSheet.appendRow([intizarId, masul.branchName, newBranchName, 'Admin', new Date()]);

  logAudit('TRANSFER_MASUL', 'Admin', 'Admin', `Transferred Mas'ul ${intizarId} from ${masul.branchName} to ${newBranchName}`);
  return sendSuccess({ message: 'Mas\'ul transferred' });
}

// ----- Zone Management -----
function handleAddZone(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { zoneName } = params;
  if (!zoneName) return sendError('Zone name required', 400);
  if (getZone(zoneName)) return sendError('Zone already exists', 400);
  const zonesSheet = getSheet('Zones');
  zonesSheet.appendRow([zonesSheet.getLastRow() + 1, zoneName, 'Active']);
  logAudit('ADD_ZONE', 'Admin', 'Admin', `Added zone ${zoneName}`);
  return sendSuccess({ message: 'Zone added' });
}

function handleEditZone(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { oldZoneName, newZoneName } = params;
  if (!oldZoneName || !newZoneName) return sendError('Old and new zone names required', 400);
  const zonesSheet = getSheet('Zones');
  const data = zonesSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[1] === oldZoneName);
  if (rowIndex === -1) return sendError('Zone not found', 400);
  zonesSheet.getRange(rowIndex + 2, 2).setValue(newZoneName);
  logAudit('EDIT_ZONE', 'Admin', 'Admin', `Renamed zone ${oldZoneName} to ${newZoneName}`);
  return sendSuccess({ message: 'Zone updated' });
}

function handleDisableZone(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { zoneName } = params;
  if (!zoneName) return sendError('Zone name required', 400);
  const zonesSheet = getSheet('Zones');
  const data = zonesSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[1] === zoneName);
  if (rowIndex === -1) return sendError('Zone not found', 400);
  zonesSheet.getRange(rowIndex + 2, 3).setValue('Disabled');
  logAudit('DISABLE_ZONE', 'Admin', 'Admin', `Disabled zone ${zoneName}`);
  return sendSuccess({ message: 'Zone disabled' });
}

// ----- Branch Management -----
function handleAddBranch(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { zoneName, branchName, branchCode } = params;
  if (!zoneName || !branchName || !branchCode) return sendError('Zone, branch name and code required', 400);
  if (!getZone(zoneName)) return sendError('Zone does not exist', 400);
  if (getBranchByCode(branchCode)) return sendError('Branch code already exists', 400);
  const branchesSheet = getSheet('Branches');
  branchesSheet.appendRow([branchName, branchCode, zoneName, 'Active']);
  logAudit('ADD_BRANCH', 'Admin', 'Admin', `Added branch ${branchName} (${branchCode}) in ${zoneName}`);
  return sendSuccess({ message: 'Branch added' });
}

function handleEditBranch(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { oldBranchName, newBranchName, newBranchCode, newZoneName } = params;
  if (!oldBranchName) return sendError('Old branch name required', 400);
  const branchesSheet = getSheet('Branches');
  const data = branchesSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === oldBranchName);
  if (rowIndex === -1) return sendError('Branch not found', 400);
  if (newBranchName) branchesSheet.getRange(rowIndex + 2, 1).setValue(newBranchName);
  if (newBranchCode) {
    const existing = getBranchByCode(newBranchCode);
    if (existing && existing.branchName !== oldBranchName) return sendError('Branch code already in use', 400);
    branchesSheet.getRange(rowIndex + 2, 2).setValue(newBranchCode);
  }
  if (newZoneName) {
    if (!getZone(newZoneName)) return sendError('Zone does not exist', 400);
    branchesSheet.getRange(rowIndex + 2, 3).setValue(newZoneName);
  }
  logAudit('EDIT_BRANCH', 'Admin', 'Admin', `Edited branch ${oldBranchName}`);
  return sendSuccess({ message: 'Branch updated' });
}

function handleDisableBranch(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { branchName } = params;
  if (!branchName) return sendError('Branch name required', 400);
  const branchesSheet = getSheet('Branches');
  const data = branchesSheet.getDataRange().getValues();
  const headers = data.shift();
  const rowIndex = data.findIndex(r => r[0] === branchName);
  if (rowIndex === -1) return sendError('Branch not found', 400);
  branchesSheet.getRange(rowIndex + 2, 4).setValue('Disabled');
  logAudit('DISABLE_BRANCH', 'Admin', 'Admin', `Disabled branch ${branchName}`);
  return sendSuccess({ message: 'Branch disabled' });
}

// ----- Get Zones & Branches -----
function handleGetZones(params, token) {
  const zonesSheet = getSheet('Zones');
  const data = zonesSheet.getDataRange().getValues();
  const headers = data.shift();
  const zones = data.map(r => ({ zoneName: r[1], status: r[2] })).filter(z => z.status === 'Active');
  return sendSuccess(zones);
}

function handleGetBranches(params, token) {
  const { zoneName } = params;
  const branchesSheet = getSheet('Branches');
  const data = branchesSheet.getDataRange().getValues();
  const headers = data.shift();
  let branches = data.map(r => ({ branchName: r[0], branchCode: r[1], zoneName: r[2], status: r[3] }))
                      .filter(b => b.status === 'Active');
  if (zoneName) branches = branches.filter(b => b.zoneName === zoneName);
  return sendSuccess(branches);
}

// ----- Audit Log (Admin only) -----
function handleGetAuditLog(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const auditSheet = getSheet('AuditLog');
  const data = auditSheet.getDataRange().getValues();
  const headers = data.shift();
  const logs = data.map(r => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  return sendSuccess(logs);
}

// ----- Edit Config (Admin only) -----
function handleEditConfig(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { key, value } = params;
  if (!key || value === undefined) return sendError('Key and value required', 400);
  const config = getConfigSheet();
  setConfigValue(config, key, value);
  logAudit('EDIT_CONFIG', 'Admin', 'Admin', `Changed config key ${key}`);
  return sendSuccess({ message: 'Config updated' });
}

// ----- Export Sheet (Admin only) -----
function handleExportSheet(params, token) {
  if (token.role !== 'Admin') return sendError('Permission denied', 403);
  const { sheetName } = params;
  if (!sheetName) return sendError('Sheet name required', 400);
  const sheet = getSheet(sheetName);
  if (!sheet) return sendError('Sheet not found', 400);
  const data = sheet.getDataRange().getValues();
  const csv = data.map(row => row.join(',')).join('\n');
  logAudit('EXPORT_SHEET', 'Admin', 'Admin', `Exported ${sheetName}`);
  return ContentService.createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV)
    .downloadAsFile(`${sheetName}.csv`);
}

function handleDownloadSheet(params, token) {
  return handleExportSheet(params, token);
}

// ----- Response Helpers -----
function sendSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}
function sendError(message, code = 400) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: message, code }))
    .setMimeType(ContentService.MimeType.JSON);
}