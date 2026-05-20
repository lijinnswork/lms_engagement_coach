export interface SettingItem {
  id: string            // unique key, matches panel id if tappable
  label: string         // display name
  category: string      // section label
  keywords: string[]    // extra search terms beyond label + category
  hasPanel: boolean     // true = opens a detail panel on tap
  iconBg: string        // tailwind bg class for icon area
  iconColor: string     // hex for icon stroke
}

export const settingsIndex: SettingItem[] = [
  // Coach preferences
  { id:'coach-freq',    label:'Check-in frequency',     category:'Coach preferences',    keywords:['frequency','messages','week'], hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'coach-tone',    label:'Coach tone',             category:'Coach preferences',    keywords:['tone','casual','warm'],        hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'goal-proposals',label:'Goal proposals',         category:'Coach preferences',    keywords:['goals','suggest'],             hasPanel:false, iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'disable-coach', label:'Disable coach',          category:'Coach preferences',    keywords:['off','disable','mute'],        hasPanel:false, iconBg:'bg-border-light/30 dark:bg-border-dark/30', iconColor:'#6B6778' },
  
  // Notifications
  { id:'quiet-hours',   label:'Quiet hours',            category:'Notifications',        keywords:['quiet','sleep','night','time'],hasPanel:true,  iconBg:'bg-accent-peach/10',  iconColor:'#E8A87C' },
  { id:'inapp-notifs',  label:'In-app notifications',   category:'Notifications',        keywords:['notifications','banner'],      hasPanel:false, iconBg:'bg-accent-peach/10',  iconColor:'#E8A87C' },
  { id:'email-summary', label:'Weekly email summary',   category:'Notifications',        keywords:['email','weekly','letter'],     hasPanel:false, iconBg:'bg-accent-peach/10',  iconColor:'#E8A87C' },
  { id:'reset-announcements', label:'Restore hidden announcements', category:'Notifications', keywords:['reset','announcements','show','hidden'], hasPanel:false, iconBg:'bg-accent-peach/10', iconColor:'#E8A87C' },
  // Learning
  { id:'study-time',    label:'Best time to study',     category:'Learning preferences', keywords:['time','morning','evening'],    hasPanel:true,  iconBg:'bg-accent-mint/10',   iconColor:'#B4C7B8' },
  { id:'goal-style',    label:'Goal style',             category:'Learning preferences', keywords:['goals','weekly','milestone'],  hasPanel:true,  iconBg:'bg-accent-mint/10',   iconColor:'#B4C7B8' },
  // Reminders
  { id:'reminder-timing', label:'Default reminder timing', category:'Reminders',         keywords:['timing','default','when'],     hasPanel:true,  iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'reminder-autosync', label:'Auto-sync from LMS',  category:'Reminders',         keywords:['sync','auto','lms'],           hasPanel:false, iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  { id:'reminder-showcompleted', label:'Show completed reminders', category:'Reminders', keywords:['completed','show','history'],hasPanel:false, iconBg:'bg-accent-sage/10',   iconColor:'#7B9EA8' },
  
  // Appearance
  { id:'theme',         label:'Theme',                  category:'Appearance',           keywords:['dark','light','mode'],         hasPanel:true,  iconBg:'bg-accent-sand/20',   iconColor:'#8A7A6E' },
  { id:'font-size',     label:'Font size',              category:'Appearance',           keywords:['font','text','size','large'],  hasPanel:true,  iconBg:'bg-accent-sand/20',   iconColor:'#8A7A6E' },
  { id:'reduce-motion', label:'Reduce motion',          category:'Appearance',           keywords:['animation','motion','reduce'], hasPanel:false, iconBg:'bg-accent-sand/20',   iconColor:'#8A7A6E' },
  
]
