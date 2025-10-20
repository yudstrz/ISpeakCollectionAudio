import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, ChevronRight, Check, User } from 'lucide-react';

const SUPABASE_URL = "https://gmsizfioshudejqqapwr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtc2l6Zmlvc2h1ZGVqcXFhcHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTY4NjMsImV4cCI6MjA3MzQ5Mjg2M30.VaXNBtnxUmu__-_sKMuEZvJmJPoWk-pf_MD1gVoNlH4";

const QUESTIONS = [
  {
    id: "RASE",
    instruction: "Read this text and pronounce it clearly",
    text: "The rapid advancement of technology has transformed the way we communicate with each other."
  },
  {
    id: "RASH",
    instruction: "Read this text and pronounce it clearly",
    text: "With a tear in your eye, you will watch as your dress begins to tear."
  },
  {
    id: "RAL",
    instruction: "Read this text and pronounce it clearly",
    text: "You don't need to spend all of your hard earned money on bakery bread. Making your own bread at home is easy with the new Double Duty Dough Mixer by Berring. Unlike other bread machines that can be difficult to clean and store, the Double Duty Dough Mixer breaks down into five parts that can go directly into your dishwasher. This stainless steel appliance will mix dough for you in a fraction of the time it takes to knead dough by hand. The automated delay feature at the beginning of the mix cycle gives your ingredients time to reach room temperature, ensuring that your breads will rise as high as bakery bread. We guarantee that the accompanying Berring Best Breads recipe book will be a family favourite."
  },
  {
    id: "DP",
    instruction: "Describe this picture using complete sentences and clear descriptions. Explain who is in the picture, what is happening, and the overall atmosphere.",
    hasImage: true,
    imageUrl: "image/describe.jpg"
  },
  {
    id: "FSDL",
    instruction: "From this statement, try to express your opinion",
    text: "Should people be responsible for what happens because of what they say? Explain with an example."
  },
  {
    id: "FSST",
    instruction: "From this statement, try to express your opinion",
    text: "Talk about the university course you enjoyed the most, describe one course you found difficult, and explain whether universities should focus more on practical skills or theoretical knowledge."
  }
];

export default function VoiceRecordingApp() {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    name: '', gender: '', programStudy: '', city: '', age: '',
    currentResidence: '', campus: '', testType: '', testScore: '', perception: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [uploadedAudios, setUploadedAudios] = useState({});
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const validateForm = () => {
    const newErrors = [];
    if (!formData.name.trim()) newErrors.push("Name is required");
    if (!formData.gender) newErrors.push("Gender is required");
    if (!formData.programStudy.trim()) newErrors.push("Program Study is required");
    if (!formData.city.trim()) newErrors.push("City is required");
    if (!formData.age || formData.age <= 0) newErrors.push("Age is required");
    if (!formData.currentResidence.trim()) newErrors.push("Current Residence is required");
    if (!formData.campus.trim()) newErrors.push("Campus is required");
    if (!formData.testType) newErrors.push("Test Type is required");
    if (formData.testType !== "Never Taken" && (!formData.testScore || formData.testScore <= 0)) {
      newErrors.push("Test Score is required");
    }
    if (!formData.perception) newErrors.push("Perception is required");
    return newErrors;
  };

  const handleSubmitForm = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/participants`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gender: formData.gender,
          program_study: formData.programStudy.trim(),
          city: formData.city.trim(),
          age: parseInt(formData.age),
          current_residence: formData.currentResidence.trim(),
          campus: formData.campus.trim(),
          test_type: formData.testType,
          test_score: formData.testType === "Never Taken" ? 0 : parseInt(formData.testScore),
          perception: formData.perception
        })
      });

      if (!response.ok) throw new Error('Failed to save participant data');
      
      setErrors([]);
      setStep('recording');
    } catch (error) {
      setErrors([`Error: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(audioBlob);
        setAudioBlob(wavBlob);
        setAudioURL(URL.createObjectURL(wavBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert('Error accessing microphone: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const convertToWav = async (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      data.push(buffer.getChannelData(i));
    }
    
    const interleaved = interleave(data);
    const dataLength = interleaved.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    floatTo16BitPCM(view, 44, interleaved);
    
    return arrayBuffer;
  };

  const interleave = (channels) => {
    const length = channels[0].length;
    const result = new Float32Array(length * channels.length);
    let offset = 0;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels.length; channel++) {
        result[offset++] = channels[channel][i];
      }
    }
    return result;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (view, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setLoading(true);
    const questionId = QUESTIONS[currentQuestion].id;
    const timestamp = Date.now();
    const fileName = `${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${questionId}_${timestamp}.wav`;

    try {
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/audio/${fileName}`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'audio/wav'
          },
          body: audioBlob
        }
      );

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const publicURL = `${SUPABASE_URL}/storage/v1/object/public/audio/${fileName}`;
      setUploadedAudios(prev => ({ ...prev, [questionId]: publicURL }));
      
      alert('✅ Audio uploaded successfully!');
      setAudioBlob(null);
      setAudioURL(null);
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const questionId = QUESTIONS[currentQuestion].id;
    const timestamp = Date.now();
    const fileName = `${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${questionId}_${timestamp}_${file.name}`;

    try {
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/audio/${fileName}`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.type
          },
          body: file
        }
      );

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const publicURL = `${SUPABASE_URL}/storage/v1/object/public/audio/${fileName}`;
      setUploadedAudios(prev => ({ ...prev, [questionId]: publicURL }));
      
      alert('✅ File uploaded successfully!');
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <User className="text-indigo-600" />
            Participant Data Form
          </h1>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-red-800 mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-red-700">
                {errors.map((error, idx) => <li key={idx}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              type="text"
              placeholder="Program Study *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.programStudy}
              onChange={(e) => setFormData({...formData, programStudy: e.target.value})}
            />

            <input
              type="text"
              placeholder="City *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />

            <input
              type="number"
              placeholder="Age *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />

            <input
              type="text"
              placeholder="Current Residence *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.currentResidence}
              onChange={(e) => setFormData({...formData, currentResidence: e.target.value})}
            />

            <input
              type="text"
              placeholder="Campus *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.campus}
              onChange={(e) => setFormData({...formData, campus: e.target.value})}
            />

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.testType}
              onChange={(e) => setFormData({...formData, testType: e.target.value, testScore: e.target.value === 'Never Taken' ? '0' : formData.testScore})}
            >
              <option value="">Select Test Type *</option>
              <option value="TOEFL">TOEFL</option>
              <option value="IELTS">IELTS</option>
              <option value="Duolingo">Duolingo</option>
              <option value="Other">Other</option>
              <option value="Never Taken">Never Taken</option>
            </select>

            <input
              type="number"
              placeholder="Test Score *"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.testScore}
              onChange={(e) => setFormData({...formData, testScore: e.target.value})}
              disabled={formData.testType === 'Never Taken'}
            />

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.perception}
              onChange={(e) => setFormData({...formData, perception: e.target.value})}
            >
              <option value="">Select Perception *</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <button
            onClick={handleSubmitForm}
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : (
              <>
                <Check size={20} />
                Proceed to Recording Session
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion >= QUESTIONS.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 flex items-center justify-center">
        <div className="max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Session Completed!</h2>
          <p className="text-gray-700 mb-6">All questions have been recorded. Thank you for participating!</p>
          <div className="space-y-3">
            {Object.entries(uploadedAudios).map(([key, url]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">{key}</p>
                <audio controls src={url} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <p className="text-sm text-gray-600">Participant: <strong>{formData.name}</strong></p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%`}}
              />
            </div>
            <span className="text-sm text-gray-600">{currentQuestion + 1}/{QUESTIONS.length}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Question {currentQuestion + 1}: {question.id}
        </h2>
        <p className="text-gray-700 mb-4"><strong>Instruction:</strong> {question.instruction}</p>
        
        {question.text && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-gray-800">{question.text}</p>
          </div>
        )}

        {question.hasImage && (
          <img 
            src={question.imageUrl} 
            alt="Description prompt" 
            className="w-full rounded-lg mb-4 shadow-md"
          />
        )}

        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 py-4 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRecording ? (
                <>
                  <Square size={20} />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic size={20} />
                  Start Recording
                </>
              )}
            </button>

            <label className="flex-1 py-4 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={20} />
              Upload File
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {audioURL && (
            <div className="border border-gray-200 rounded-lg p-4">
              <audio controls src={audioURL} className="w-full mb-3" />
              <button
                onClick={uploadAudio}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Uploading...' : 'Upload This Recording'}
              </button>
            </div>
          )}

          {uploadedAudios[question.id] && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">✅ Audio uploaded for this question</p>
              <audio controls src={uploadedAudios[question.id]} className="w-full" />
            </div>
          )}

          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
          >
            Next Question
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}