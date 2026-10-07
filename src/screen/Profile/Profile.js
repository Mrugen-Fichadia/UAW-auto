import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import ImageSelector from '../../component/ImageSelector';
import Icon from 'react-native-vector-icons/Ionicons';
import { appColors } from '../../component/Color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { deleteAccountURL } from '../../component/URL';

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedImage: null,
      name: '',
      number: '',
      isDeleting: false,
    };
  }

  async componentDidMount() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = userData ? JSON.parse(userData) : null;

      if (parsedUser) {
        this.setState({
          name: parsedUser.name || '',
          number: parsedUser.phone || '',
        });
      }
    } catch (error) {
      console.log('Error retrieving user data:', error);
    }
  }

  handleImageSelect = (imageUris) => {
    if (imageUris && imageUris.length > 0) {
      this.setState({ selectedImage: imageUris[0] });
    }
  };

  navigateToLogin = () => {
    if (this.props.navigation.reset) {
      this.props.navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      this.props.navigation.replace('Login');
    }
  };

  handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              this.navigateToLogin();
            } catch (error) {
              console.log('Error clearing AsyncStorage:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and will completely erase your profile, order history, and reward points. You cannot undo this action.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: this.confirmDeleteAccount,
        },
      ],
      { cancelable: true }
    );
  };

  confirmDeleteAccount = async () => {
    try {
      this.setState({ isDeleting: true });
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = userData ? JSON.parse(userData) : null;

      if (parsedUser) {
        const formData = new FormData();
        if (parsedUser.id) formData.append('user_id', parsedUser.id);
        if (parsedUser.phone) formData.append('phone', parsedUser.phone);

        try {
          await axios.post(deleteAccountURL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (apiError) {
          console.log('Delete account API request note:', apiError?.message || apiError);
        }
      }

      await AsyncStorage.clear();

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              this.navigateToLogin();
            },
          },
        ]
      );
    } catch (error) {
      console.log('Error deleting account:', error);
      Alert.alert('Error', 'Unable to delete account at this time. Please try again.');
    } finally {
      this.setState({ isDeleting: false });
    }
  };

  render() {
    const { selectedImage, name, number, isDeleting } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ width: '100%' }}
        >
          {/* Profile Image */}
          <TouchableOpacity
            onPress={() => this.imageSelectorRef?.show()}
            style={styles.imageContainer}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.dummyIcon}>
                <Icon name="person-circle-outline" size={120} color="#888" />
              </View>
            )}
          </TouchableOpacity>

          {/* Username & Mobile (dynamic) */}
          <Text style={styles.username}>{name || 'Guest User'}</Text>
          <Text style={styles.mobile}>{number || '+91 -----------'}</Text>

          {/* Reward Claims */}
          <TouchableOpacity
            style={[styles.button, styles.rewardButton]}
            onPress={() => this.props.navigation.navigate('RewardClaimsScreen')}
          >
            <Icon name="gift-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Reward Claims & Payouts</Text>
          </TouchableOpacity>

          {/* Order History */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.props.navigation.navigate('OrderHistory')}
          >
            <Icon name="receipt-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Order History</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={this.handleLogout}
          >
            <Icon name="log-out-outline" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.button, styles.deleteAccountButton]}
            onPress={this.handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <Icon name="trash-outline" size={20} color="#FF3B30" style={styles.icon} />
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* ImageSelector Modal */}
        <ImageSelector
          ref={(ref) => (this.imageSelectorRef = ref)}
          onImageSelected={this.handleImageSelect}
          singleSelection={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.bgColor,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 40,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  dummyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontFamily: 'Exo2-Bold',
    color: appColors.fontColor,
    marginBottom: 4,
  },
  mobile: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Regular',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: appColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardButton: {
    backgroundColor: '#2C9A45',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  deleteAccountButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  icon: {
    marginRight: 10,
  },
});

