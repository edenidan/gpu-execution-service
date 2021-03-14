// @ts-check
const { promisify } = require('util');
const { writeFile, unlink } = require('fs').promises;
const { exec, spawn } = require('child_process');
const { tmpdir } = require('os');
const express = require('express');
const uniqueFilename = require('unique-filename');

const execAsync = promisify(exec);

const decodeBase64 = (/** @type {string} */ base64Encoded) => Buffer.from(base64Encoded, 'base64').toString();

const getRandomFilePath = () => uniqueFilename(tmpdir());

const compileSource = async (/** @type {string} */ sourceCode) => {
  const baseFilePath = getRandomFilePath();

  const sourceFilePath = `${baseFilePath}.cu`;
  await writeFile(sourceFilePath, sourceCode);

  const binaryFilePath = `${baseFilePath}.exe`;
  await execAsync(`nvcc -o ${binaryFilePath} ${sourceFilePath}`);

  unlink(sourceFilePath);
  return binaryFilePath;
};

const executeAndPipeOutput = async (/** @type {string} */ binaryFilePath, res) => new Promise((resolve) => {
  const child = spawn(binaryFilePath);
  const onEnd = async () => {
    res.end();
    unlink(binaryFilePath);
    resolve();
  };
  child.stdout.on('end', onEnd);
  child.stdout.pipe(res);
});

const app = express();
app.use(express.json());

app.post('/source', async (req, res) => {
  const binaryFilePath = await compileSource(decodeBase64(req.body.data));
  await executeAndPipeOutput(binaryFilePath, res);
});

app.post('/binary', async (req, res) => {
  const binaryFilePath = `${getRandomFilePath()}.exe`;
  await writeFile(binaryFilePath, decodeBase64(req.body.data));
  await executeAndPipeOutput(binaryFilePath, res);
});

const port = 3000;
app.listen(port, () => {
  console.log(`running on port ${port}`);
});
