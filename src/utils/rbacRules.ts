import { UserRole, UserPermission } from '../types';

export function getRolePermissions(role: UserRole, factoryId: string = 'ALL'): UserPermission {
  switch (role) {
    case 'System_Admin':
      return {
        canImportExcel: true,
        canApproveTransfer: true,
        canCreateTransfer: true,
        canReceiveShipment: true,
        canEditMasterData: true,
        canUseAiAdvisor: true,
        canManageUsers: true,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Supply_Chain_Manager':
      return {
        canImportExcel: true,
        canApproveTransfer: true,
        canCreateTransfer: true,
        canReceiveShipment: false,
        canEditMasterData: true,
        canUseAiAdvisor: true,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Factory_Planner':
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: true,
        canReceiveShipment: false,
        canEditMasterData: false,
        canUseAiAdvisor: true,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: [factoryId || 'FAC-DBD'],
      };
    case 'Logistics_Officer':
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: false,
        canReceiveShipment: true,
        canEditMasterData: false,
        canUseAiAdvisor: false,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
    case 'Viewer':
    default:
      return {
        canImportExcel: false,
        canApproveTransfer: false,
        canCreateTransfer: false,
        canReceiveShipment: false,
        canEditMasterData: false,
        canUseAiAdvisor: false,
        canManageUsers: false,
        canExportReports: true,
        allowedFactoryIds: ['ALL'],
      };
  }
}

