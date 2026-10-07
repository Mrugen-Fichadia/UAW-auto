import React, { Component, createRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

import CustomDropdownPicker from '../../component/CustomDropdownPicker';
import CustomHeader from '../../component/CustomHeader';
import { appColors } from '../../component/Color';
import { signUpURL } from '../../component/URL';
import CustomTextInput from '../../component/CustomTextInput';
import DateSelector from '../../component/DateSelector';
import cityData from './../../component/india-cities.json'
const { width } = Dimensions.get('window');

// Static state and city data (replace with all you need)
const STATES = [
  ...new Set(cityData.map(item => item.state))
].sort().map(state => ({
  label: state,
  value: state.toLowerCase().replace(/ /g, '_')
}));

const CITIES = cityData.reduce((acc, { name, state }) => {
  const key = state.toLowerCase().replace(/ /g, '_');
  acc[key] = acc[key] || [];
  acc[key].push({
    label: name,
    value: name.toLowerCase().replace(/ /g, '_')
  });
  return acc;
}, {});


export default class Register extends Component {
  constructor(props) {
    super(props);

    const { mobile, otp } = props.route.params || {};

    this.state = {
      name: '',
      companyName: '',
      mobileNumber: mobile || '',
      dob: '',
      country: 'India',
      state: null,
      city: null,
      otp: otp || '',
    };

    this.companyNameRef = createRef();
    this.mobileNumberRef = createRef();
    this.dobRef = createRef();
  }

  showFlash = (message) => {
    showMessage({
      message,
      type: 'danger',
      icon: 'danger',
      position: 'bottom',
      floating: true,
    });
  };

  validateFields = () => {
    const { name, companyName, mobileNumber, dob, state, city } = this.state;

    if (!name.trim()) return this.showFlash('Name is required');
    if (!companyName.trim()) return this.showFlash('Company Name is required');
    if (!mobileNumber.trim()) return this.showFlash('Mobile Number is required');
    if (!/^[0-9]{10}$/.test(mobileNumber)) return this.showFlash('Enter a valid 10-digit Mobile Number');
    if (!state) return this.showFlash('State is required');
    if (!city) return this.showFlash('City is required');

    return true;
  };
   convertToDateFormat = (inputDate) => {
    if (!inputDate) return '';
  
    const [day, month, year] = inputDate.split('/');
  
    // Ensure day and month are always 2 digits
    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
  
    return `${year}-${formattedMonth}-${formattedDay}`;
  };
  
  handleRegister = async () => {
    if (!this.validateFields()) return;

    const { name, companyName, mobileNumber, dob, country, state, city, otp } = this.state;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('company_name', companyName);
    formData.append('phone', mobileNumber);
    if (dob && dob.trim()) {
      formData.append('dob', this.convertToDateFormat(dob));
    }
    formData.append('country', country);
    formData.append('state', state);
    formData.append('city', city);
    formData.append('otp', otp);
console.log("formData",formData)
    try {
      const response = await axios.post(signUpURL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status) {
        const user = response?.data?.user;
        if (user) {
          await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
        this.props.navigation.replace('Login');
      } else {
        console.log("response.data.message",response.data.message)
        this.showFlash(response.data.message || 'Registration failed.');
      }
    } catch (error) {
      console.log("error",error)
      this.showFlash(error.response?.data?.message || 'Something went wrong.');
    }
  };

  render() {
    const { name, companyName, mobileNumber, dob, country, state, city } = this.state;

    // Get cities list for selected state or empty array if no state selected
    const citiesData = state ? CITIES[state] || [] : [];

    return (
      <View style={styles.container}>
        <CustomHeader title="Create Account" navigation={this.props.navigation}/>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <CustomTextInput
              placeholder="Name"
              value={name}
              onChangeText={text => this.setState({ name: text })}
              returnKeyType="next"
              onSubmitEditing={() => this.companyNameRef.current?.focus()}
              inputFontSize={16}
            />

            <CustomTextInput
              placeholder="Company Name"
              value={companyName}
              onChangeText={text => this.setState({ companyName: text })}
              returnKeyType="next"
              onSubmitEditing={() => this.mobileNumberRef.current?.focus()}
              inputFontSize={16}
              onRef={ref => (this.companyNameRef.current = ref)}
            />

            <CustomTextInput
              placeholder="Mobile Number"
              value={mobileNumber}
              keyboardType="phone-pad"
              onChangeText={text => this.setState({ mobileNumber: text })}
              returnKeyType="next"
              maxLength={10}
              inputFontSize={16}
              onSubmitEditing={() => this.dobRef.current?.focus()}
              onRef={ref => (this.mobileNumberRef.current = ref)}
            />

            <DateSelector
              value={dob}
              placeholder="Date of Birth (Optional)"
              onChange={(date) => this.setState({ dob: date })}
              ref={this.dobRef}
            />

            <View style={styles.fixedCountryContainer}>
              <Text style={styles.fixedCountryText}>Country: {country}</Text>
            </View>

            <CustomDropdownPicker
              data={STATES}
              placeholder="Select State"
              value={state}
              onValueChange={value => this.setState({ state: value, city: null })}
            />
            

            <CustomTextInput
  placeholder="City"
  value={city || ''}
  onChangeText={text => this.setState({ city: text })}
  inputFontSize={16}
/>

            <TouchableOpacity style={styles.registerButton} onPress={this.handleRegister}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.alreadyText}>Already Account?</Text>
              <TouchableOpacity onPress={() => this.props.navigation.navigate('Login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    alignItems: 'center',
    paddingBottom: 30,
  },
  fixedCountryContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#999',
  },
  fixedCountryText: {
    fontSize: 16,
    color: '#000',
  },
  registerButton: {
    width: '100%',
    height: 50,
    backgroundColor: appColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    color: appColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  alreadyText: {
    fontSize: 16,
    color: '#555',
    fontFamily:'Exo2-SemiBold'
  },
  loginText: {
    fontSize: 18,
    color: appColors.primary,
    fontFamily: 'Exo2-Bold',
    marginTop: 2,
  },
});
