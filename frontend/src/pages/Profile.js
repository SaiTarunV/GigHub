import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
  Avatar,
  Badge,
  Tooltip,
  CircularProgress,
  Stack,
  Link,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Add, PhotoCamera, LinkedIn as LinkedInIcon, Work as WorkIcon, School as SchoolIcon, Business as BusinessIcon, Link as LinkIcon } from '@mui/icons-material';
import Tree from 'react-d3-tree';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SkillTree from '../components/SkillTree';
import EditProfileDialog from '../components/EditProfileDialog';
import ManageSkillsDialog from '../components/ManageSkillsDialog';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[3],
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile, updateSkills } = useAuth();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    college: '',
    major: '',
    graduationYear: '',
    company: '',
    position: '',
    companyWebsite: '',
    contactInfo: {
      phone: '',
      linkedin: '',
      github: '',
      website: ''
    }
  });
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [previousGigs, setPreviousGigs] = useState([]);
  const [activeGigs, setActiveGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSkillDialog, setOpenSkillDialog] = useState(false);
  const [openPortfolioDialog, setOpenPortfolioDialog] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Beginner', subSkills: [] });
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    technologies: [],
  });
  const [activeTab, setActiveTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSkillsDialog, setOpenSkillsDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [id, currentUser?._id]);

  useEffect(() => {
    if (user?.role === 'recruiter') {
      fetchActiveGigs();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/${id || currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data;
      setUser(userData);
      
      setProfileData({
        name: userData.name || '',
        bio: userData.bio || '',
        college: userData.college || '',
        major: userData.major || '',
        graduationYear: userData.graduationYear || '',
        company: userData.company || '',
        position: userData.position || '',
        companyWebsite: userData.companyWebsite || '',
        contactInfo: userData.contactInfo || {
          phone: '',
          linkedin: '',
          github: '',
          website: ''
        }
      });
      
      // Ensure skills have proper structure when setting from user data
      const processedSkills = (userData.skills || []).map(skill => ({
        id: skill.id || Date.now(),
        name: skill.name,
        level: skill.level?.toLowerCase() || 'beginner',
        children: (skill.children || []).map(child => ({
          id: child.id || Date.now() + 1,
          name: child.name,
          level: child.level?.toLowerCase() || 'beginner'
        })) || []
      }));
      
      setSkills(processedSkills);
      setPortfolio(userData.portfolio || []);
      setPreviousGigs(userData.previousGigs || []);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.response?.data?.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveGigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = id || currentUser?._id;
      
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/jobs/recruiter/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveGigs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active gigs:', error);
      setError(error.response?.data?.message || 'Failed to fetch active gigs');
      setLoading(false);
    }
  };

  const isOwnProfile = !id || id === currentUser?._id;

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Alert severity="error">User not found</Alert>
      </Container>
    );
  }

  const renderRecruiterProfile = () => (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={user?.profilePicture}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {profileData.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {profileData.position}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profileData.company}
            </Typography>
            {profileData.companyWebsite && (
              <Link
                href={profileData.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'inline-flex', alignItems: 'center', mt: 1 }}
              >
                <LinkIcon sx={{ mr: 0.5 }} />
                Company Website
              </Link>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">About</Typography>
              {isOwnProfile && (
                <IconButton onClick={() => setIsEditing(true)}>
                  <EditIcon />
                </IconButton>
              )}
            </Box>
            <Typography variant="body1" color="text.secondary">
              {profileData.bio || 'No bio added yet.'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Active Gigs</Typography>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : activeGigs.length > 0 ? (
              <Stack spacing={2}>
                {activeGigs.map((gig) => (
                  <Paper key={gig._id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {gig.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {gig.description}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={gig.status} color={gig.status === 'Open' ? 'success' : 'default'} size="small" />
                          <Chip label={`${gig.applicants?.length || 0} applications`} size="small" />
                        </Stack>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/jobs/${gig._id}`)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                {isOwnProfile 
                  ? "No active gigs. Create your first gig to start hiring!"
                  : "No active gigs at the moment."}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contact Information</Typography>
            </Box>
            <Stack spacing={2}>
              {profileData.contactInfo?.linkedin && (
                <Link
                  href={profileData.contactInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <LinkedInIcon sx={{ mr: 1 }} />
                  LinkedIn Profile
                </Link>
              )}
              {profileData.contactInfo?.phone && (
                <Typography>
                  <strong>Phone:</strong> {profileData.contactInfo.phone}
                </Typography>
              )}
              {profileData.contactInfo?.website && (
                <Link
                  href={profileData.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Personal Website
                </Link>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  const renderStudentProfile = () => (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={user?.profilePicture}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {profileData.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {profileData.major}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profileData.college}
            </Typography>
            {profileData.graduationYear && (
              <Typography variant="body2" color="text.secondary">
                Graduation Year: {profileData.graduationYear}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">About</Typography>
              {isOwnProfile && (
                <IconButton onClick={() => setIsEditing(true)}>
                  <EditIcon />
                </IconButton>
              )}
            </Box>
            <Typography variant="body1" color="text.secondary">
              {profileData.bio || 'No bio added yet.'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Skills</Typography>
              {isOwnProfile && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setOpenSkillsDialog(true)}
                >
                  Edit Skills
                </Button>
              )}
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {skills.map((skill) => (
                <Chip
                  key={skill.id}
                  label={`${skill.name} (${skill.level})`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Portfolio</Typography>
              {isOwnProfile && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setOpenPortfolioDialog(true)}
                >
                  Edit Portfolio
                </Button>
              )}
            </Box>
            <Grid container spacing={2}>
              {portfolio.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    {item.projectUrl && (
                      <Link
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <LinkIcon sx={{ mr: 0.5 }} />
                        View Project
                      </Link>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contact Information</Typography>
            </Box>
            <Stack spacing={2}>
              {profileData.contactInfo?.linkedin && (
                <Link
                  href={profileData.contactInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <LinkedInIcon sx={{ mr: 1 }} />
                  LinkedIn Profile
                </Link>
              )}
              {profileData.contactInfo?.github && (
                <Link
                  href={profileData.contactInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <LinkIcon sx={{ mr: 1 }} />
                  GitHub Profile
                </Link>
              )}
              {profileData.contactInfo?.website && (
                <Link
                  href={profileData.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Personal Website
                </Link>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {user?.role === 'student' ? renderStudentProfile() : renderRecruiterProfile()}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            {user?.role === 'student' ? (
              <>
                <TextField
                  label="College"
                  value={profileData.college}
                  onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Major"
                  value={profileData.major}
                  onChange={(e) => setProfileData({ ...profileData, major: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Graduation Year"
                  value={profileData.graduationYear}
                  onChange={(e) => setProfileData({ ...profileData, graduationYear: e.target.value })}
                  fullWidth
                />
              </>
            ) : (
              <>
                <TextField
                  label="Company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Position"
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Company Website"
                  value={profileData.companyWebsite}
                  onChange={(e) => setProfileData({ ...profileData, companyWebsite: e.target.value })}
                  fullWidth
                />
              </>
            )}
            <TextField
              label="LinkedIn"
              value={profileData.contactInfo.linkedin}
              onChange={(e) => setProfileData({
                ...profileData,
                contactInfo: { ...profileData.contactInfo, linkedin: e.target.value }
              })}
              fullWidth
            />
            {user?.role === 'student' && (
              <TextField
                label="GitHub"
                value={profileData.contactInfo.github}
                onChange={(e) => setProfileData({
                  ...profileData,
                  contactInfo: { ...profileData.contactInfo, github: e.target.value }
                })}
                fullWidth
              />
            )}
            <TextField
              label="Personal Website"
              value={profileData.contactInfo.website}
              onChange={(e) => setProfileData({
                ...profileData,
                contactInfo: { ...profileData.contactInfo, website: e.target.value }
              })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                await updateProfile(profileData);
                setIsEditing(false);
                fetchUserProfile();
              } catch (error) {
                console.error('Error updating profile:', error);
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Skills Dialog */}
      <ManageSkillsDialog
        open={openSkillsDialog}
        onClose={() => setOpenSkillsDialog(false)}
        onSave={async (updatedSkills) => {
          try {
            console.log('Saving updated skills:', updatedSkills);
            
            // Ensure skills have proper structure
            const processedSkills = updatedSkills.map(skill => ({
              id: skill.id || Date.now(),
              name: skill.name,
              level: skill.level.toLowerCase(),
              children: (skill.children || []).map(child => ({
                id: child.id || Date.now() + 1,
                name: child.name,
                level: child.level.toLowerCase()
              }))
            }));

            // Update skills directly through the skills endpoint
            const response = await axios.patch(
              'http://localhost:5000/api/users/skills',
              { skills: processedSkills },
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              }
            );

            // Update local state with the processed skills
            setSkills(processedSkills);
            
            // Update the user context with the fresh data
            updateProfile(response.data);
            
            console.log('Skills saved and state updated:', processedSkills);
          } catch (error) {
            console.error('Error updating skills:', error);
            if (error.response) {
              console.error('Error response:', error.response.data);
            }
          }
        }}
        currentSkills={skills}
      />

      {/* Add Portfolio Item Dialog */}
      <Dialog open={openPortfolioDialog} onClose={() => setOpenPortfolioDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Portfolio Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Project Title"
              value={newPortfolioItem.title}
              onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newPortfolioItem.description}
              onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="Project Link"
              value={newPortfolioItem.projectUrl}
              onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, projectUrl: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPortfolioDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const response = await axios.post(
                  'http://localhost:5000/api/users/portfolio',
                  newPortfolioItem,
                  {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                  }
                );
                updateProfile(response.data);
                setOpenPortfolioDialog(false);
                setNewPortfolioItem({
                  title: '',
                  description: '',
                  imageUrl: '',
                  projectUrl: '',
                  technologies: [],
                });
              } catch (error) {
                console.error('Error adding portfolio item:', error);
              }
            }}
          >
            Add Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 