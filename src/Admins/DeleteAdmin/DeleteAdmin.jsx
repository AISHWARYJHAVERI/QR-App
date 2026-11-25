import { Button } from 'primereact/button';
import axios from 'axios';
import { adminAuthHeaders } from '../../utils/adminAuth';

const DeleteAdmin = ({ rowData, canManage = false, onAdminDeleted, showError, showSuccess }) => {
    const confirmDeleteAdmin = async () => {
        if (window.confirm(`Are you sure you want to delete ${rowData.name}?`)) {
            try {
                await axios.delete(`/admins/${rowData.id}`, { headers: adminAuthHeaders() });
                showSuccess("Admin Deleted Successfully");
                onAdminDeleted(rowData.id);
            } catch (error) {
                showError(error.response?.data?.error || "Error deleting admin");
            }
        }
    };

    return (
        <Button
            label="Delete"
            icon="pi pi-trash"
            outlined
            severity="danger"
            onClick={confirmDeleteAdmin}
            disabled={!canManage}
            title={canManage ? 'Delete Admin' : 'Only QR-only admins can be deleted here'}
        />
    );
};

export default DeleteAdmin;
