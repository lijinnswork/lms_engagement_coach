import type { SettingItem } from './settingsIndex';

export const accountIndex: SettingItem[] = [
  // Profile
  { id:'profile',       label:'Full name',              category:'Profile',              keywords:['name','display'],              hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'profile',       label:'Avatar / profile photo', category:'Profile',              keywords:['photo','picture','avatar'],    hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'profile',       label:'Email address',          category:'Profile',              keywords:['email','login'],               hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  
  // Linked Accounts
  { id:'lms-account',   label:'Connected LMS account',  category:'Linked Accounts',      keywords:['openedx','lms','connect'],     hasPanel:true,  iconBg:'bg-border-light/20 dark:bg-border-dark/20', iconColor:'#6B6778' },
  
  // Security
  { id:'change-password',label:'Change password',       category:'Security',             keywords:['password','security'],         hasPanel:true,  iconBg:'bg-accent-peach/10',  iconColor:'#E8A87C' },
  { id:'active-sessions',label:'Active sessions',       category:'Security',             keywords:['devices','login','sessions'],  hasPanel:true,  iconBg:'bg-accent-peach/10',  iconColor:'#E8A87C' },
  
  // My Data
  { id:'data-summary',  label:'Data summary',           category:'My Data',              keywords:['data','summary','info'],       hasPanel:true,  iconBg:'bg-accent-sand/20',   iconColor:'#8A7A6E' },
  { id:'export-data',   label:'Export my data',         category:'My Data',              keywords:['export','download','backup'],  hasPanel:true,  iconBg:'bg-border-light/20 dark:bg-border-dark/20', iconColor:'#6B6778' },
  { id:'delete-account',label:'Delete account',         category:'My Data',              keywords:['delete','account','close'],    hasPanel:true,  iconBg:'bg-red-500/5',        iconColor:'#A05050' },
  
  // Sign Out
  { id:'sign-out',      label:'Sign out',               category:'Session',              keywords:['logout','signout'],            hasPanel:false, iconBg:'bg-border-light/20 dark:bg-border-dark/20', iconColor:'#6B6778' },
]
