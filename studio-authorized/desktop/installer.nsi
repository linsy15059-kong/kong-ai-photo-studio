!include "MUI2.nsh"
!include "x64.nsh"
Name "${PRODUCT_NAME}"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\PhotographyToneStudio"
SetCompressor /SOLID lzma
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"
Function .onInit
 ${IfNot} ${RunningX64}
  MessageBox MB_ICONSTOP "本软件需要 64 位 Windows 10 或 Windows 11。"
  Abort
 ${EndIf}
 SetShellVarContext current
FunctionEnd
Section "Install"
 SetOutPath "$INSTDIR"
 File /r "${PROJECT_DIR}/release/win-unpacked/*"
 WriteUninstaller "$INSTDIR\Uninstall.exe"
 CreateDirectory "$SMPROGRAMS\摄影定调工作台"
 CreateShortcut "$SMPROGRAMS\摄影定调工作台\摄影定调工作台.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
 CreateShortcut "$DESKTOP\摄影定调工作台.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "DisplayName" "${PRODUCT_NAME}"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "DisplayVersion" "${VERSION}"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "DisplayIcon" "$INSTDIR\${PRODUCT_FILENAME}.exe"
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio" "NoRepair" 1
SectionEnd
Function un.onInit
 SetShellVarContext current
 StrCmp "$INSTDIR" "$LOCALAPPDATA\Programs\PhotographyToneStudio" valid
  MessageBox MB_ICONSTOP "安装路径异常，已停止卸载。"
  Abort
 valid:
FunctionEnd
Section "Uninstall"
 Delete "$DESKTOP\摄影定调工作台.lnk"
 Delete "$SMPROGRAMS\摄影定调工作台\摄影定调工作台.lnk"
 RMDir "$SMPROGRAMS\摄影定调工作台"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhotographyToneStudio"
 RMDir /r "$INSTDIR"
SectionEnd
