import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API requests
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(0);
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showPagination, setShowPagination] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null); // State to store selected file
  const [selectedFileIds, setSelectedFileIds] = useState([]); // State to store selected file IDs
  const [searchQuery, setSearchQuery] = useState(''); // State to store search query
  const [modalFile, setModalFile] = useState(null); // File to display in modal

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login'); // Redirect to login if no token is found
    } else {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode JWT token (simple approach)
      setUsername(decodedToken.username || 'User'); // Assuming the username is stored in the token
      setUserId(decodedToken.id || 'Id'); // Assuming the username is stored in the token
    }
  }, [navigate]);

  // Function to fetch files from the API
  const fetchFiles = async (page = 1) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token in the Authorization header
        },
        params: { page }, // Add pagination params if needed
      });
      console.log("done",response)
      setFiles(response?.data?.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    if (userId > 0) fetchFiles(); // Fetch files when the component mounts
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove token on logout
    navigate('/login'); // Redirect to login page
  };

  const handlePageChange = (page) => {
    fetchFiles(page); // Fetch files for the selected page
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first!');
      return;
    }
    const formData = new FormData();
    formData.append('user_id', userId); // Assuming user_id is 1
    formData.append('file', selectedFile); // Append the selected file

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token in the Authorization header
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchFiles(); // Re-fetch the files after upload
      setSelectedFile(null); // Reset the selected file
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file.');
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (fileId) => {
    setSelectedFileIds((prevSelectedFileIds) =>
      prevSelectedFileIds.includes(fileId)
        ? prevSelectedFileIds.filter((id) => id !== fileId) // Remove from selection if already selected
        : [...prevSelectedFileIds, fileId] // Add to selection if not already selected
    );
  };

  // Handle delete action
  const handleDelete = async () => {
    if (selectedFileIds.length === 0) {
      toast.error('Please select files to delete!');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delete-file`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          file_ids: selectedFileIds,
        },
      });
      fetchFiles(); // Re-fetch files after deletion
      setSelectedFileIds([]); // Reset selected file IDs
      toast.success('Files deleted successfully!');
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error('Error deleting files.');
    }
  };

  // Handle search action
  const handleSearch = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/search`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { search: searchQuery },
      });
      setFiles(response.data.data);
      if (response?.data?.pagination.total > response?.data?.pagination.per_page) {
        setShowPagination(true)
      }
      else {
        setShowPagination(false)
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('Error fetching search results.');
    }
  };

  const handleFileClick = (file) => {
    setModalFile(file); // Set the file to be shown in the modal
  };

  const renderFileContent = () => {
    if (!modalFile) return null;

    console.log("modal==", modalFile);
    const fileExtension = modalFile.file_path.split('.').pop().toLowerCase();
    console.log("fileExtension==", fileExtension);
    const fileUrl = `${import.meta.env.VITE_FILE_BASE_URL}${modalFile.file_path}`;

    if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension)) {
      return (
        <img
          src={fileUrl}
          alt="File Preview"
          className="img-fluid"
        />
      );
    } else if (['pdf'].includes(fileExtension)) {
      return (
        <iframe
          src={fileUrl}
          title="PDF Preview"
          className="w-100"
          style={{ height: '500px', border: 'none' }}
        ></iframe>
      );
    } else if (['docx', 'xls', 'xlsx', 'doc'].includes(fileExtension)) {
      return (
        <div>
          <a href={fileUrl} download={modalFile.file_name} className="btn btn-primary">
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      );
    } else if (['mp4'].includes(fileExtension)) {
      return (
        <video
          controls
          className="w-100"
          style={{ height: 'auto', maxHeight: '500px' }}
        >
          <source src={fileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (fileExtension === 'zip') {
      return (
        <div className="d-flex align-items-center">
          <i className="bi bi-folder-fill text-warning fs-1 me-3"></i> {/* ZIP folder icon */}
          <a href={fileUrl} download={modalFile.file_name} className="btn btn-primary">
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      );
    } else {
      return <p>Preview not available for this file type.</p>;
    }
  };



  return (
    <div className="container mt-5">
      <div className="card p-5">
        <div className='title_section mb-5'>
          <h1>Welcome, {username} 👋!</h1>
          <button onClick={handleLogout} className="btn btn-danger mb-3">
            Log Out
          </button>
        </div>

        {/* Upload Section */}
        <div className="mb-3 upload_section">
          <input type="file" onChange={handleFileChange} className="form-control mb-1" />
          <button onClick={handleUpload} className="btn btn-success">
            Upload File
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-3 search_section">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control mb-1"
            placeholder="Search files"
          />
          <button onClick={handleSearch} className="btn btn-primary">
            Search
          </button>
        </div>

        {/* Delete Section */}
        <div className="mb-3 deleted_button">
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Selected Files
          </button>
        </div>

        <div className="file-list mb-2">
          <h2>List of Uploaded Files</h2>
          {files.length > 0 ? (
            <table className="table table-bordered table-striped">
              <thead className="thead-dark">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFileIds(files.map((file) => file.id)); // Select all files
                        } else {
                          setSelectedFileIds([]); // Deselect all files
                        }
                      }}
                    />
                  </th>
                  <th>SR No.</th>
                  <th>File Name</th>
                  <th>File Path</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={file.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => handleCheckboxChange(file.id)}
                      />
                    </td>
                    <td>{(pagination.current_page - 1) * pagination.per_page + (index + 1)}</td> {/* Serial Number column */}
                    <td>{file.file_name}</td>
                    <td>
                      <button
                        className="btn btn-info"
                        onClick={() => handleFileClick(file)}
                      >
                        View File
                      </button>
                    </td>
                    <td>{new Date(file.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No files available.</p>
          )}
        </div>

        <div className="pagination">
          {showPagination && pagination.total > pagination.per_page && (
            <div className="d-flex justify-content-center">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="btn btn-primary mx-2"
              >
                Previous
              </button>
              <span>
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="btn btn-primary mx-2"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal for File Viewing */}
        {modalFile && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">File Preview</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModalFile(null)}
                  ></button>
                </div>
                <div className="modal-body">{renderFileContent()}</div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalFile(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
